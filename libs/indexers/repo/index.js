const fs = require("fs");
const JSONStream = require("JSONStream");
const Reporter = require("../../reporter");
const { AbstractIndexer } = require("../../index_tools");
const fetch = require('node-fetch');

const AgencyJsonStream = require("./AgencyJsonStream");
const RepoIndexerStream = require("./RepoIndexStream");

class RepoIndexer extends AbstractIndexer {

  get LOGGER_NAME() {
    return "repo-indexer";
  }

  constructor({adapter, agencyEndpointsFile, fetchedFilesDir, fallbackFilesDir=null, params}) {
    super(adapter, params);
    this.indexCounter = 0;
    this.agencyEndpointsFile = agencyEndpointsFile;
    this.fetchedFilesDir = fetchedFilesDir;
    this.fallbackFilesDir = fallbackFilesDir;

  }

  async getMetadata() {
    let response;

    if(process.env.GET_REMOTE_METADATA) {
      response = await fetch(this.agencyEndpointsFile);
      return response.body;
    }

    return fs.createReadStream(this.agencyEndpointsFile);
  }

  async indexRepos(config) {

    const agencyEndpointsStream = await this.getMetadata();
    const jsonStream = JSONStream.parse("*");
    const agencyJsonStream = new AgencyJsonStream(this.fetchedFilesDir, this.fallbackFilesDir, config);
    const indexerStream = new RepoIndexerStream(this, config);

    return new Promise((fulfill, reject) => {
      agencyEndpointsStream
        .pipe(jsonStream)
        .on("error", (error) => {
          reject(error);
        })
        .pipe(agencyJsonStream)
        .on("error", (error) => {
          reject(error);
        })
        .pipe(indexerStream)
        .on("error", (error) => {
          reject(error);
        })
        .on("finish", () => {
          const finishedMsg = `Indexed ${this.indexCounter} ${this.esType} documents.`;
          this.logger.info(finishedMsg);
          fulfill(finishedMsg);
        });
    });
  }

  static async init(adapter, config) {
    const params = {
      esHosts: config.ES_HOST,
      esAlias: config.REPO_INDEX_CONFIG.esAlias,
      esType: config.REPO_INDEX_CONFIG.esType,
      esMapping: config.REPO_INDEX_CONFIG.mappings,
      esSettings: config.REPO_INDEX_CONFIG.settings
    }
    const repoIndexer = new RepoIndexer({
      adapter,
      agencyEndpointsFile: config.AGENCY_ENDPOINTS_FILE,
      fetchedFilesDir: config.FETCHED_DIR,
      fallbackFilesDir: config.FALLBACK_DIR,
      params
    });

    repoIndexer.logger.info(`Started indexing (${repoIndexer.esType}) indices.`);

    try {
      const exists = await repoIndexer.indexExists();
      if(exists) {
        await repoIndexer.deleteIndex();
      }
      await repoIndexer.initIndex();
      await repoIndexer.initMapping();
      await repoIndexer.indexRepos(config);
      await Reporter.indexReport(config);

      repoIndexer.logger.info(`Finished indexing (${repoIndexer.esType}) indices.`);
      return {
        esAlias: repoIndexer.esAlias,
        esIndex: repoIndexer.esIndex,
        esType: repoIndexer.esType,
        esMapping: repoIndexer.esMapping,
        esSettings: repoIndexer.esSettings
      };
    } catch(error) {
      repoIndexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = RepoIndexer;
