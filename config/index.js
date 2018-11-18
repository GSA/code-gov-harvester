const cfenv = require('cfenv');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Get the Elasticsearch service URL.
 * If running on Cloud Foundry the service name is fetched from the environment to later get the service configuration from Cloud Foundry.
 * If not running on Cloud Foundry the Elasticsearch service URL is obtained from environment variables.
 * Defaults to `http://localhost:9200`
 * @default
 * @param {object} cloudFoundryEnv - Cloud Foundry app environment object.
 * @returns {string} - The Elasticsearch service URL
 */
function getElasticsearchUri(cloudFoundryEnv) {
  if(!cloudFoundryEnv.isLocal){
    const serviceName = process.env.ELASTICSEARCH_SERVICE_NAME
      ? process.env.ELASTICSEARCH_SERVICE_NAME
      : 'code_gov_elasticsearch';

    const elasticSearchCredentials = cloudFoundryEnv.getServiceCreds(serviceName);

    return elasticSearchCredentials.uri
      ? elasticSearchCredentials.uri
      : 'http://localhost:9200';
  }
  return process.env.ES_URI ? process.env.ES_URI : 'http://localhost:9200';
}

/**
 * Get the necessary application directories.
 * @returns {object} - Directory paths needed by the application
 */
function getAppFilesDirectories() {
  let filePath;

  if(process.env.GET_REMOTE_METADATA && process.env.REMOTE_METADATA_LOCATION) {
    filePath = process.env.REMOTE_METADATA_LOCATION;
  } else {
    filePath = process.env.NODE_ENV === 'testing'
      ? path.join(path.dirname(__dirname), 'config/testing_agency_metadata.json')
      : path.join(path.dirname(__dirname), 'config/agency_metadata.json');
  }

  return {
    AGENCY_ENDPOINTS_FILE: filePath,
    DISCOVERED_DIR: path.join(path.dirname(__dirname), "/data/discovered"),
    FETCHED_DIR: path.join(path.dirname(__dirname), "/data/fetched"),
    DIFFED_DIR: path.join(path.dirname(__dirname), "/data/diffed"),
    FALLBACK_DIR: path.join(path.dirname(__dirname), "/data/fallback")
  };
}

/**
 * Get the application configuration for the supplied environment
 * @param {string} env - The application environment. This will default to a development environment
 * @returns {object} - object with all the configuration needed for the environment
 */
function getConfig(env='development') {
  let config = {
    prod_envs: ['prod', 'production'],
    staging_envs: ['stag', 'staging'],
    development_envs: ['dev', 'development', 'testing', 'test']
  };

  const cloudFoundryEnv = cfenv.getAppEnv();

  config.isProd = config.prod_envs.includes(env);

  if(cloudFoundryEnv.isLocal) {
    dotenv.config(path.join(path.dirname(__dirname), '.env'));
  }

  config.LOGGER_LEVEL = process.env.LOGGER_LEVEL
    ? process.env.LOGGER_LEVEL
    : config.isProd
      ? 'INFO'
      : 'DEBUG';

  config.TERM_TYPES_TO_INDEX = [
    "name",
    "agency.name",
    "agency.acronym",
    "tags",
    "languages"];
  config.TERM_TYPES_TO_SEARCH = [
    "name",
    "agency.name",
    "agency.acronym",
    "tags",
    "languages"];
  config.supportedSchemaVersions = [
    '1.0.1',
    '2.0',
    '2.0.0'
  ];
  config.UPDATE_REPO_REGEX = /(1\.0)(\.\d)?/;
  config.GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;
  config.GITHUB_AUTH_TYPE = process.env.GITHUB_AUTH_TYPE || 'token';

  config.GET_REMOTE_METADATA = process.env.GET_REMOTE_METADATA && process.env.GET_REMOTE_METADATA === 'true';
  config.GET_GITHUB_DATA = process.env.GET_GITHUB_DATA && process.env.GET_GITHUB_DATA === 'true';
  config.ES_HOST = getElasticsearchUri(cloudFoundryEnv);

  Object.assign(config, getAppFilesDirectories());

  return config;
}

module.exports = getConfig;
