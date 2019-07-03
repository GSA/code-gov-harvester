const getConfig = require("../../../config");
const { GitHubDataIndexer } = require("../../../libs/indexers");

const { Logger } = require("../../../libs/loggers");
const adapters = require('@code.gov/code-gov-adapter');

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
    this.logger = new Logger({ name: 'github-data-index-script', level: config.LOGGER_LEVEL });
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
      await GitHubDataIndexer.init(this.elasticsearchAdapter, this.config);

      this.logger.debug(`Finished indexing GitHub Data`);
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
    .then(() => indexer.logger.debug(`Finished indexing GitHub data.`))
    .catch(error => indexer.logger.error(error));
}

module.exports = Indexer;
