const getConfig = require("../../../config");
const IssuesIndexer = require("../../../libs/indexers/issues");
const { AliasSwapper, IndexCleaner, IndexOptimizer } = require("../../../libs/index_tools");

const { Logger } = require("../../../libs/loggers");
const adapters = require('@code.gov/code-gov-adapter');

const DAYS_TO_KEEP = process.env.DAYS_TO_KEEP || 2;

/**
 * Defines the class responsible for creating and managing the elasticsearch indexes
 *
 * @class Indexer
 */
class Indexer {

  /**
   * Creates an instance of Indexer.
   *
   * @constructor
   * @param {object} config Application configuration object.
   */
  constructor(config) {
    this.logger = new Logger({ name: 'issues-index-script', level: config.LOGGER_LEVEL });
    this.config = config;

    this.elasticsearchAdapter = adapters.elasticsearch.ElasticsearchAdapter;
  }

  /**
   * Index projects from configured data source. See config.AGENCY_ENDPOINTS_FILE
   * @returns {object} Information of index and aliases created during the indexing process
   */
  async index() {

    this.logger.info('Started indexing.');

    try {
      const repoIndexInfo = await IssuesIndexer.init(this.elasticsearchAdapter, this.config);
      await IndexOptimizer.optimizeIndex({
        adapter: this.elasticsearchAdapter,
        index: repoIndexInfo.esIndex,
        config: this.config
      });
      await AliasSwapper.swapAlias({
        adapter: this.elasticsearchAdapter,
        index: repoIndexInfo.esIndex,
        alias: repoIndexInfo.esAlias,
        config: this.config
      });
      await IndexCleaner.cleanIndexes({
        adapter: this.elasticsearchAdapter,
        alias: repoIndexInfo.esAlias,
        dayToKeep: DAYS_TO_KEEP,
        config: this.config
      });

      this.logger.debug(`Finished indexing repos`);
      return repoIndexInfo;
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }
}

// If we are running this module directly from Node this code will execute.
// This will index all repos taking our default input.
if (require.main === module) {
  let indexer = new Indexer(getConfig(process.env.NODE_ENV));
  indexer.index()
    .then(indexInfo => indexer.logger.debug(`Finished indexing repos issues ${JSON.stringify(indexInfo)}`))
    .catch(error => indexer.logger.error(error));
}

module.exports = Indexer;
