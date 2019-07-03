const { AbstractIndexer } = require("../../index_tools");
const { Logger } = require('../../loggers');
const { getClient, getCodeGovRepos, getGitHubRepoData } = require('../../integrations/github');

class GitHubDataIndexer extends AbstractIndexer {
  get LOGGER_NAME() {
    return 'github-data-indexer';
  }

  constructor(adapter, params, config) {
    super(adapter, params);
    this.logger = new Logger( { name: this.LOGGER_NAME, level: config.LOGGER_LEVEL });
    this.client = getClient();
  }

  async updateRepo(repoId, repoData) {

    return await this.updateDocument({
      index: this.esIndex,
      type: this.esType,
      id: repoId,
      document: repoData,
      requestTimeout: 90000
    });
  }
  parseGitHubData(repoData) {
    return {
      stars: repoData.stargazers_count,
      watchers: repoData.watchers_count,
      forks: repoData.forks_count,
      created_at: repoData.created_at,
      updated_at: repoData.updated_at
    };
  }
  async indexGitHubData() {
    const codeGovRepos = await getCodeGovRepos(this.adapter);

    for(const { owner, repo, codeGovRepoId, repositoryURL } of codeGovRepos) {
      this.logger.info(`Processing code_gov_repo_id: ${codeGovRepoId} - repository_url: ${repositoryURL}`);

      const { error, repo: repoData } = await getGitHubRepoData({ owner, repo, client: this.client });

      if(Object.keys(error).length) {
        this.logger.error(error);
      }

      if(repoData) {
        const parsedData = parseGitHubData(repoData)
        await this.updateRepo(codeGovRepoId, parsedData);
      }
    }
  }

  static async init(adapter, config) {
    const params = {
      esAlias: config.REPO_INDEX_CONFIG.esAlias,
      esType: config.REPO_INDEX_CONFIG.esType,
      esMapping: config.REPO_INDEX_CONFIG.mappings,
      esSettings: config.REPO_INDEX_CONFIG.settings,
      esHosts: config.ES_HOST,
      esApiVersion: config.ELASTICSEARCH_API_VERSION
    };

    const indexer = new GitHubDataIndexer(adapter, params, config);

    indexer.logger.info(`Started indexing (${indexer.esType}) indices.`);

    try {
      const exists = await indexer.indexExists();

      if(!exists) {
        // TODO: throw error. Index must exist to be able to update documents
      }
      await indexer.indexGitHubData();

    } catch(error) {
      indexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = GitHubDataIndexer;
