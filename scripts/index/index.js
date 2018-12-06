const getConfig = require('../../config');
const RepoIndexer = require("./repo");
const TermIndexer = require("./term");
const IssueIndexer = require('./issues');
const { Logger } = require("../../libs/loggers");

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
    this.logger = new Logger({ name: "index-script", level: config.LOGGER_LEVEL });
    this.config = config;
  }

  async index() {
    let repoIndexer = new RepoIndexer(this.config);
    let termIndexer = new TermIndexer(this.config);
    let issueIndexer = new IssueIndexer(this.config)

    try {
      await repoIndexer.index();
      await termIndexer.index();
      await issueIndexer.index();
    } catch(error) {
      this.logger.error(error);
      throw error;
    }
  }

  schedule(timeInterval) {
    setInterval(this.index, delayInSeconds * 1000);
  }
}

if (require.main === module) {
  const config = getConfig(process.env.NODE_ENV);
  let indexer = new Indexer(config);

  if(process.env.INDEX_INTERVAL) {
    indexer.schedule(process.env.INDEX_INTERVAL)
  } else {
    indexer.index()
      .then(() => indexer.logger.info('Indexing process complete'))
      .catch(error => indexer.logger.error(error));
  }
}

module.exports = Indexer;
