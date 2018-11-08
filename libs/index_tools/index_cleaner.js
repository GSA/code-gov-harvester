const _ = require("lodash");
const { Logger, ElasticsearchLogger }  = require('../loggers');
const getConfig = require('../../config');
const adapter = require('@code.gov/code-gov-adapter');

/**
 * Class for cleaning ElasticSearch Indexes
 *
 * @class IndexCleaner
 */
class IndexCleaner {

  /**
   * Creates an instance of IndexCleaner.
   *
   *@constructor
   * @param {object} adapter The search adapter to use for connecting to ElasticSearch
   * @param {object} config Configuration object to use.
   */
  constructor(adapter, config) {
    this.logger = new Logger({ name: 'index-cleaner' });
    try {
      this.adapter = new adapter({
        hosts: config.ES_HOST,
        logger: ElasticsearchLogger
      });
    } catch(error) {
      throw error;
    }
  }

  /**
   * Gets a date in days since epoch
   *
   * @param {data} date
   * @returns
   */
  _toDays(date) {
    date = date || 0;
    let milli_in_days = 24 * 60 * 60 * 1000;

    return Math.floor(date / milli_in_days);
  }

  /**
   * Gets the indices that begin with an alias name that are older than days to keep.
   *
   * @param {string} aliasName The alias to clean indices for.
   * @param {integer} daysToKeep The amount of days to keep of indices. Defaults to 7.
   * @returns {Array} An array of indices from today up to the amount of daysToKeep
   */
  async getIndices({ aliasName, daysToKeep=7 }) {
    this.logger.info(`Getting Indices for (${aliasName})`);
    try {
      const results = await this.adapter.getSettings({
        index: (aliasName + '*'),
        name: 'index.creation_date'
      });
      let indices = [];

      let currTime = this._toDays(Date.now());
      let cutoffTime = currTime - daysToKeep;

      for(const [key, value] of Object.entries(results)){
        const index_date = this._toDays(value["settings"]["index"]["creation_date"]);
        if (index_date < cutoffTime) {
          indices.push(key);
        }
      }

      return indices;
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Removes any indices from a list that are associated with a specific alias.
   *
   * @param {string} aliasName The alias to check
   * @param {Array} indices A list of indices to filter
   */
  async filterAliasedIndices({ aliasName, indices=[] }) {
    try {
      const results = this.adapter.getIndexesForAlias({ alias: aliasName });
      return _.difference(indices, results);
    } catch (error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Deletes a list of indices from ElasticSearch
   *
   * @param {Array} indices
   */
  async deleteIndices({ indices, requestTimeout=30000 }) {
    try {
      const results = await this.adapter.deleteIndex({
        index: indices,
        requestTimeout: requestTimeout
      });

      return results;

    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Performs all the steps to clean a single alias
   *
   * @param {string} aliasName
   */
  async cleanIndicesForAlias(aliasName, daysToKeep) {
    try {
      const indices = await this.getIndices({ aliasName, daysToKeep });
      if(indices.length > 0) {
        const deleteResults = await this.deleteIndices({ indices, requestTimeout: 90000 });
        this.logger.trace(deleteResults);
        return deleteResults;
      }
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Initializes and executes the cleaning of old repo indices
   *
   * This will remove all indicies greater than 'daysToKeep' old that
   * begin with the alias names supplied index the repoIndexInfo
   * objects.  NOTE: This will not remove indicies associated
   * with either alias regardless of age.
   *
   * @static
   * @param {object} adapter The search adapter to use for making requests to ElasticSearch
   * @param {string} repoAlias The alias name for clinical repos
   * @param {integer} daysToKeep The number of days of indices to keep.
   */
  static async cleanIndexes({ adapter, alias, daysToKeep, config }) {

    let cleaner = new IndexCleaner(adapter, config);
    cleaner.logger.info(`Starting index cleaning.`);
    try {
      return await cleaner.cleanIndicesForAlias(alias, daysToKeep);
    } catch(error) {
      cleaner.logger.trace(error);
      throw error;
    }
  }
}

/**
 * The first two indexes of the argv array are the execution path and the file being executed. The parameters we want start at the third index.
 * More info here: https://nodejs.org/api/process.html#process_process_argv
 */
if (require.main === module) {
  const alias = process.argv[2];
  const daysToKeep = parseInt(process.argv[3]);
  const config = getConfig(process.env.NODE_ENV);
  const logger = new Logger({ name: 'index-cleaner' });

  IndexCleaner.cleanIndexes({
    adapter: adapter.elasticsearch.ElasticsearchAdapter,
    alias,
    daysToKeep,
    config
  })
    .then(() => logger.info(`Index cleanup completed for Alias: ${alias}`))
    .catch(error => logger.trace(`There were errors while cleaning indexes for Alias: ${alias}`, error));
}

module.exports = IndexCleaner;
