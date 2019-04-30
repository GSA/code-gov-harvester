const { AbstractIndexer } = require("../../index_tools");
const crypto = require("crypto");
const { Logger } = require('../../loggers');
const { getClient, getCodeGovRepos, getRepoIssues } = require('../../integrations/github');
const { Utils } = require('../../utils');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;

class IssuesIndexer extends AbstractIndexer {
  get LOGGER_NAME() {
    return 'issues-indexer';
  }

  constructor(adapter, params, config) {
    super(adapter, params);
    this.logger = new Logger( { name: this.LOGGER_NAME, level: config.LOGGER_LEVEL });
    this.client = getClient();
  }

  async indexIssue (issue) {
    const id = Utils.transformStringToKey(issue.title);

    return await this.indexDocument({
      index: this.esIndex,
      type: this.esType,
      id,
      document: issue,
      requestTimeout: 90000
    });
  }

  async writeToFile(data, fileName) {
    const fields = [
      'issueId', 'repoId', 'url', 'state', 'updated_at', 'merged_at', 'created_at', 'title',
      'description','body','labels','repositoryURL','agencyName','agencyAcronym', 'agencyWebsite'
    ];
    let csv;

    try {
      const parser = new Json2csvParser({ fields });
      csv = parser.parse(data);
    } catch (err) {
      this.logger.error(err);
    }

    fs.writeFile(fileName,csv, { flag: 'a' }, error => {
      if(error) this.logger.error(error);
    });
  }
  formatIssue(issue, codeGovRepoId, agency, repositoryURL) {
    issue.repoId = codeGovRepoId;
    issue.issueId = Utils.transformStringToKey(issue.title);
    issue.agencyName = agency.name;
    issue.agencyAcronym = agency.acronym;
    issue.repositoryURL = repositoryURL;

    return issue;
  }
  async indexIssues() {
    const codeGovRepos = await getCodeGovRepos(this.adapter);
    const outputFileName = `./issues-${new Date().toISOString()}.csv`;

    for(const { owner, repo, codeGovRepoId, agency, repositoryURL } of codeGovRepos) {
      this.logger.info(`Processing repo: ${owner}/${repo} - agency: ${agency.acronym} - code_gov_repo_id: ${codeGovRepoId} - repository_url: ${repositoryURL}`);
      let { issues, error } = await getRepoIssues({ owner, repo, client: this.client });

      if(Object.keys(error).length) {
        this.logger.error(error);
      }

      if(issues.length) {
        issues = issues.map(issue => this.formatIssue(issue, codeGovRepoId, agency, repositoryURL));

        this.writeToFile(issues, outputFileName);
        issues.forEach(async issue => {
          this.logger.info('Indexing issue', issue);
          try{
            await this.indexIssue(issue);
          }catch(error) {
            this.logger.error(error);
          }
        });
      }
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
