const getConfig = require('../../config');
const { Logger } = require('../loggers');
const BodyBuilder = require('bodybuilder');
const integrations = require('@code.gov/code-gov-integrations');
const { Utils } = require('../utils');
const adapters = require('@code.gov/code-gov-adapter');

function getBody(from, size) {
  const bodybuilder = new BodyBuilder();
  return bodybuilder
    .from(from)
    .size(size)
    .aggregation('max', 'score', 'max_data_score' )
    .aggregation('min', 'score', 'min_data_score' )
    .build();
}

async function getRepos({from=0, size=100, collection=[], adapter}) {
  let body = getBody(from, size);

  const {total, data} = await adapter.search({ index: 'repos', type: 'repo', body});
  const delta = total - from;

  if(delta < size) {
    return {total, data: collection };
  }
  from += size;

  return await getRepos({ from, size, collection: collection.concat(data), adapter });
}

async function getGithubData({ adapter, index, type, config, log=undefined }) {
  const elasticSearchAdapter = new adapter({
    hosts: config.ES_HOST,
    logger: Logger,
    apiVersion: config.ELASTICSEARCH_API_VERSION
  });

  const logger = log
    ? log
    : new Logger({ name: 'github-data-integration', level: config.LOGGER_LEVEL });

  const ghClient = integrations.github.getClient({
    type: config.GITHUB_AUTH_TYPE,
    token: config.GITHUB_TOKEN
  });

  logger.info('Fetching repos');
  const { total, data } = await getRepos({ from:0, size: 100, adapter: elasticSearchAdapter });
  logger.debug(`Fetched ${total} repos.`);

  let totalUpdated = 0;

  try {
    logger.info(`Fetching Github data.`);
    for(let document of data) {
      if(document.repositoryURL && Utils.isGithubUrl(document.repositoryURL)) {
        const { owner, repo } = Utils.parseGithubUrl(document.repositoryURL);
        let ghData = {};

        try {
          logger.debug(`Getting github data for ${document.repoID}`);
          ghData = await integrations.github.getData(owner, repo, ghClient);

          document.ghDescription = ghData.description;
          document.forks = ghData.forks_count;
          document.watchers = ghData.watchers_count;
          document.stars = ghData.stargazers_count;
          document.title = ghData.title;
          document.topics = ghData.topics;
          document.ghFullName = ghData.full_name;
          document.hasIssues = ghData.has_issues;
          document.ghOrganization = ghData.organization;
          document.sshUrl = ghData.ssh_url;
          document.ghCreatedAt = ghData.created_at;
          document.ghUpdatedAt = ghData.updated_at;
          document.readme = ghData.readme;
          document.ghLanguages = ghData.languages;
          document.issues = ghData.issues;
          document.contributors = ghData.contributors;
          document.remoteVcs = 'github';

          await elasticSearchAdapter.updateDocument({
            index,
            type,
            id: document.repoID,
            document
          });
          totalUpdated += 1;
        } catch(error) {
          logger.error(error);
        }
      }
    }
    logger.info(`Updated ${totalUpdated} repos`);
  } catch(error) {
    throw error;
  }
}

if(require.main === module) {
  const config = getConfig(process.env.NODE_ENV);
  const adapter = adapters.elasticsearch.ElasticsearchAdapter;
  const log = new Logger({ name: 'github-data-integration', level: config.LOGGER_LEVEL });

  if(process.argv.length < 4) {
    throw new Error('Not enough parameters passed. targetIndex and alias are required.')
  }

  const index = process.argv[2]
  const type = process.argv[3]

  getGithubData({ adapter, index, type, config, log })
    .then(() => logger.info('Finished fetching Github data.'))
    .catch(error => logger.error(error));
}

module.exports = {
  getGithubData
};
