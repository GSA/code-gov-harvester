const getConfig = require('../../config');
const RepoIndexer = require("./repo");
const TermIndexer = require("./term");
const IssueIndexer = require('./issues');
const { Logger } = require("../../libs/loggers");
const cron = require('node-cron');

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

  async indexRepos() {
    let repoIndexer = new RepoIndexer(this.config);

    try {
      await repoIndexer.index();
    } catch(error) {
      this.logger.error(error);
      throw error;
    }
  }
  async indexTerms() {
    let termIndexer = new TermIndexer(this.config);

    try {
      await termIndexer.index();
    } catch(error) {
      this.logger.error(error);
      throw error;
    }
  }
  async indexIssues() {
    let issueIndexer = new IssueIndexer(this.config)

    try {
      await issueIndexer.index();
    } catch(error) {
      this.logger.error(error);
      throw error;
    }
  }

  schedule({ jobName, cronConfig, scheduleParameters, targetFunction }) {
    return cron.schedule(cronConfig, () => {
      this.logger.info(`Executing job: ${jobName}`)
      targetFunction()
        .then(() => {
          this.logger.info(`Finished job: ${jobName}.`);
        })
        .catch(error => {
          this.logger.error(`[ERROR] job: ${jobName} - ${error}`)
        });
    }, scheduleParameters);
  }
}

if (require.main === module) {
  const config = getConfig(process.env.NODE_ENV);
  let indexer = new Indexer(config);
  const scheduleParameters = { scheduled: true, timezone: config.TIME_ZONE };

  indexer.schedule({
    jobName: `index-repos`,
    cronConfig: config.REPOS_INDEX_CRON_CONFIG,
    scheduleParameters,
    targetFunction: indexer.indexRepos.bind(indexer)
  });
  indexer.schedule({
    jobName: `index-terms`,
    cronConfig: config.TERMS_INDEX_CRON_CONFIG,
    scheduleParameters,
    targetFunction: indexer.indexTerms.bind(indexer)
  });
  indexer.schedule({
    jobName: `index-issues`,
    cronConfig: config.ISSUE_INDEX_CRON_CONFIG,
    scheduleParameters,
    targetFunction: indexer.indexIssues.bind(indexer)
  });
}

module.exports = Indexer;
