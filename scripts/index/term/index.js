const getConfig = require('../../../config');
const { TermIndexer } = require("../../../libs/indexers");
const { AliasSwapper, IndexCleaner, IndexOptimizer } = require('../../../libs/index_tools');
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
   */
  constructor(config) {
    this.logger = new Logger({name: "term-index-script", level: config.LOGGER_LEVEL});
    this.config = config;
    this.elasticsearchAdapter = adapters.elasticsearch.ElasticsearchAdapter;
  }

  /**
   * Index the terms contained in the repos core
   */
  async index() {

    this.logger.info("Started indexing.");

    try {
      const termIndexInfo = await TermIndexer.init(this.elasticsearchAdapter);

      await IndexOptimizer.optimizeIndex({
        adapter: this.elasticsearchAdapter,
        index: termIndexInfo.esIndex,
        config: this.config
      });
      await AliasSwapper.swapAlias({
        adapter: this.elasticsearchAdapter,
        index: termIndexInfo.esIndex,
        alias: termIndexInfo.esAlias,
        config: this.config
      });
      await IndexCleaner.cleanIndexes({
        adapter: this.elasticsearchAdapter,
        alias: termIndexInfo.esAlias,
        daysToKeep: DAYS_TO_KEEP,
        config: this.config
      });

      this.logger.debug(`Finished indexing: ${JSON.stringify(termIndexInfo)}`);
      return termIndexInfo;

    } catch(error) {
      this.logger.error(error);
      throw error;
    }
  }
}

// If we are running this module directly from Node this code will execute.
// This will index all terms taking our default input.
if (require.main === module) {
  const config = getConfig(process.env.NODE_ENV);
  let termsIndexer = new Indexer(config);

  termsIndexer.index()
    .then(termIndexInfo => termsIndexer.logger.info(`Finished indexing: ${JSON.stringify(termIndexInfo)}`))
    .catch(error => termsIndexer.logger.error(error));
}

module.exports = Indexer;
