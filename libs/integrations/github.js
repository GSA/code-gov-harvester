const getConfig = require('../../config');
const { Logger } = require('../loggers');
const BodyBuilder = require('bodybuilder');
const config = getConfig(process.env.NODE_ENV);
const integrations = require('@code.gov/code-gov-integrations');
const { Utils } = require('../utils');

const logger = new Logger({name: 'get-github-issues'});

function getClient() {
  return integrations.github.getClient({
    type: config.GITHUB_AUTH_TYPE,
    token: config.GITHUB_TOKEN
  });
}

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

  logger.info(`Fetching repositories from Code.gov. Page: ${from/size}`);
  const {total, data} = await adapter.search({ index: 'repos', type: 'repo', body});
  logger.info(`Fetched ${from + size} repositories from Code.gov.`);
  const delta = total - from;

  if(delta < size) {
    return {total, data: collection };
  }
  from += size;

  return await getRepos({ from, size, collection: collection.concat(data), adapter });
}

async function getCodeGovRepos(adapter) {
  const {total, data} = await getRepos({ adapter });
  const codeGovRepos = data.filter(repo => {
    return repo.permissions.usageType === 'openSource' && repo.repositoryURL && Utils.isGithubUrl(repo.repositoryURL)
  });

  logger.info('Filtering Code.gov repos to only those on Github.')
  return codeGovRepos.map(codeGovRepo => {
    const {owner, repo} = Utils.parseGithubUrl(codeGovRepo.repositoryURL);

    agency = {
      name: codeGovRepo.agency.name,
      acronym: codeGovRepo.agency.acronym,
      website: codeGovRepo.agency.website
    }

    return {
      owner,
      repo ,
      agency,
      codeGovRepoId: codeGovRepo.repoID,
      repositoryURL: codeGovRepo.repositoryURL
     };
  });
}

async function getRepoIssues({ owner, repo, client }) {
  try {
    return await integrations.github.getRepoIssues({owner, repo, client});
  } catch(error) {
    throw error;
  }
}

module.exports = {
  getClient,
  getCodeGovRepos,
  getRepoIssues
}