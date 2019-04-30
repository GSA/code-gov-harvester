const Writable = require("stream").Writable;
const { SearchStream } = require("../../utils");
const { AbstractIndexer } = require("../../index_tools");
const RepoTermLoaderStream= require("./repo_term_loader_stream");
const getConfig = require('../../../config');
const { Logger } = require('../../loggers');

class RepoTermIndexerStream extends Writable {

  constructor(termIndexer) {
    super({ objectMode: true });
    this.termIndexer = termIndexer;
    this.logger = termIndexer.logger;
  }

  _indexTerm(term) {
    let id = `${term.term_key}_${term.term_type}`;
    this.logger.debug(`Indexing term (${id}).`);

    return new Promise((resolve, reject) => {
      this.termIndexer.indexDocument({
        index: this.termIndexer.esIndex,
        type: this.termIndexer.esType,
        id: id,
        document: term
      })
        .then((response, status) => {
          if (status) {
            this.logger.debug('termIndexer.indexDocument - Status', status);
          }

          this.termIndexer.indexCounter++;

          resolve(response);
        })
        .catch(err => {
          this.logger.error(err);
          reject(err);
        });
    });
  }

  _write(term, enc, next) {
    this._indexTerm(term)
      .then(response => {
        return next(null, response);
      })
      .catch(error => {
        return next(error, null);
      });
  }

}

class TermIndexer extends AbstractIndexer {

  get LOGGER_NAME() {
    return "term-indexer";
  }

  constructor(adapter, config) {
    const indexParams = {
      esHosts: config.ES_HOST,
      esAlias: config.TERM_INDEX_CONFIG.esAlias,
      esType: config.TERM_INDEX_CONFIG.esType,
      esMapping: config.TERM_INDEX_CONFIG.mappings,
      esSettings: config.TERM_INDEX_CONFIG.settings,
      esApiVersion: config.ELASTICSEARCH_API_VERSION
    }
    super(adapter, indexParams);

    this.logger = new Logger({ name: this.LOGGER_NAME, level: config.LOOGER_LEVEL});

    let searchQuery = {
      index: config.REPO_INDEX_CONFIG.esAlias,
      type: config.REPO_INDEX_CONFIG.esType,
      body: {}
    };
    this.ss = new SearchStream(adapter, searchQuery);
    this.indexCounter = 0;
    this.config = config;
  }

  indexTerms() {
    let ss = this.ss;
    let rs = new RepoTermLoaderStream(this, this.config);
    let is = new RepoTermIndexerStream(this, this.config);

    ss.pipe(rs).pipe(is).on("finish", () => {
      this.logger.info(`Indexed ${this.indexCounter} ${this.esType} documents.`);
    });
  }

  static async init(adapter) {

    let termIndexer = new TermIndexer(adapter, getConfig(process.env.NODE_ENV));
    termIndexer.logger.info(`Started indexing (${termIndexer.esType}) indices.`);

    try {
      const exists = await termIndexer.indexExists();

      if(exists) {
        await termIndexer.deleteIndex();
      }

      await termIndexer.initIndex();
      await termIndexer.initMapping();
      await termIndexer.indexTerms();

      return {
        esAlias: termIndexer.esAlias,
        esIndex: termIndexer.esIndex,
        esType: termIndexer.esType,
        esMapping: termIndexer.esMapping,
        esSettings: termIndexer.esSettings
      };
    } catch(error) {
      termIndexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = {
  TermIndexer,
  RepoTermIndexerStream
};
