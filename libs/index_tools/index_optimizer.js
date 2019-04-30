const adapters = require('@code.gov/code-gov-adapter');
const { Logger, ElasticsearchLogger } = require('../loggers');
const getConfig = require('../../config');

/**
 * Class for optimizing ElasticSearch Indexes
 *
 * @class IndexOptimizer
 */
class IndexOptimizer {

  /**
   * Creates an instance of AliasSwapper.
   *
   * @constructor
   * @param {object} adapter The search adapter to use for connecting to ElasticSearch. Must be a constructor.
   * @param {string[]} hosts A list of Elasticsearch hosts
   * @param {object} logger A logger instance of Winston or Bunyan like loggers.
   */
  constructor({ adapter, config, logger=undefined }) {
    this.adapter = new adapter({
      hosts: config.ES_HOST,
      logger: ElasticsearchLogger,
      apiVersion: config.ELASTICSEARCH_API_VERSION
    });
    this.logger = logger ? logger : new Logger({ name: 'index-optimizer', level: config.LOGGER_LEVEL });
  }

  /**
   * Optimizes (forceMerge) an index into 1 segment so that
   * all elasticsearch servers return the same scores for
   * searches.
   *
   * @param {string} index The index to optimize.
   * @returns {Promise}
   */
  async forceMerge({ maxNumSegments=1, index, requestTimeout=30000 }) {
    this.logger.info(`Optimizing Index (${index})`);

    try {
      return await this.adapter.forceMerge({ maxNumSegments, index, requestTimeout });
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Initializes and executes the optimizing of for repos
   *
   * @static
   * @param {object} adapter An Elasticsearch adapter constructor.
   * @param {string} index The index name to optimize.
   * @param {object} config The current execution configuration.
   * @param {[object]} logger A Winston or Bunyan like logger instance. Defaults to undefined
   */
  static async optimizeIndex({ adapter, index, requestTimeout=30000, config, logger=undefined }) {

    let optimizer = new IndexOptimizer({ adapter, config, logger });
    optimizer.logger.info(`Starting index optimization.`);
    try {
      return await optimizer.forceMerge({
        index,
        requestTimeout
      });
    } catch(error) {
      optimizer.logger.error(error);
      throw error;
    }
  }
}

if(!require.main === 'module') {
  const config = getConfig(porcess.env.NODE_ENV);
  const logger = new Logger({ name: 'index-optimizer' });

  try {
    if(process.argv.length > 2) {
      let index;
      let requestTimeout = 30000;

      if(process.argv[2]) {
        index = process.argv[2];
      } else {
        throw new Error('Index was not supplied.');
      }

      if(process.argv[3]) {
        if( isNaN(parseInt(process.argv[3])) || parseInt(process.argv[3]) < 0 ) {
          throw new Error('Timeout option must be a valid positive number.');
        }

        requestTimeout = parseInt(process.argv[3]);
      }

      IndexOptimizer.optimizeIndex({
        adapter: apapters.elasticsearch.ElasticsearchAdapter,
        index,
        requestTimeout,
        config,
        logger
      })
        .then(() => logger.info(`Finished optimizing indices.`))
        .catch(error => logger.error(`An error occurred while optimizing the index: ${index}`, error));
    } else {
      throw new Error('Not enough arguments were passed to the script. The minimum arguments expected is the index name or alias.');
    }
  } catch(error) {
    logger.error(`An error has occurred while optimizing`, error);
  }
}

module.exports = {
  IndexOptimizer
};
