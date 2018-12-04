const { AbstractIndexer } = require("../../index_tools");
const crypto = require("crypto");
const { Logger } = require('../../loggers');
const { getClient, getCodeGovRepos, getRepoIssues } = require('../../integrations/github')
const { Utils } = require('../../utils');

class IssuesIndexer extends AbstractIndexer {
  get LOGGER_NAME() {
    return 'issues-indexer';
  }

  constructor(adapter, params, config) {
    super(adapter, params);
    this.logger = new Logger( { name: this.LOGGER_NAME, level: config.LOGGER_LEVEL });
    this.client = getClient();
  }

  async indexIssue (issue, codeGovRepoId) {
    const id = Utils.transformStringToKey(issue.title)
    issue.repoId = codeGovRepoId;

    return await this.indexDocument({
      index: this.esIndex,
      type: this.esType,
      id,
      document: issue
    });
  }

  async indexIssues() {
    const codeGovRepos = await getCodeGovRepos(this.adapter);

    for(const { owner, repo, codeGovRepoId } of codeGovRepos) {
      const { issues, error } = await getRepoIssues({ owner, repo, client: this.client });

      if(Object.keys(error).length) {
        this.logger.error(error)
      }

      issues.forEach(async issue => await this.indexIssue(issue, codeGovRepoId));
    }
  }

  static async init(adapter, config) {
    const params = {
      esAlias: config.ISSUE_INDEX_CONFIG.esAlias,
      esType: config.ISSUE_INDEX_CONFIG.esType,
      esMapping: config.ISSUE_INDEX_CONFIG.mappings,
      esSettings: config.ISSUE_INDEX_CONFIG.settings,
      esHosts: config.ES_HOST,
      esApiVersion: config.ELASTICSEARCH_API_VERSION
    };

    const indexer = new IssuesIndexer(adapter, params, config);

    indexer.logger.info(`Started indexing (${indexer.esType}) indices.`);

    try {
      const exists = await indexer.indexExists();

      if(exists) {
        indexer.deleteIndex();
      }
      const indexInfo = await indexer.initIndex();
      await indexer.initMapping();
      await indexer.indexIssues();

      return { esIndex: indexInfo.index, esAlias: indexer.esAlias };
    } catch(error) {
      indexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = IssuesIndexer;
