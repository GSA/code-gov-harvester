const moment = require("moment");
const { ElasticsearchLogger} = require('../loggers');
class AbstractIndexer {

  get LOGGER_NAME() {
    return "abstract-indexer";
  }

  constructor(adapter, params) {
    const now = moment();
    const timestamp = now.format('YYYYMMDD_HHmmss');

    this.adapter = new adapter({
      hosts: params.esHosts,
      logger: ElasticsearchLogger,
      apiVersion: params.esApiVersion
    });

    this.esAlias = params.esAlias ? params.esAlias : undefined;
    this.esIndex = params.esIndex
      ? params.esIndex
      : this.esAlias
        ? this.esAlias + timestamp
        : undefined;
    this.esType = params.esType ? params.esType : undefined;
    this.esMapping = params.esMapping ? params.esMapping : undefined;
    this.esSettings = params.esSettings ? params.esSettings : undefined;
  }

  _toTitleCase(str) {
    return str.replace(/\w\S*/g,
      function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

  deleteIndex() {
    this.logger.info(`Deleting index (${this.esIndex}).`);
    return this.adapter.deleteIndex(this.esIndex);
  }

  initIndex() {
    this.logger.info(`Creating index (${this.esIndex}).`);
    return this.adapter.createIndex({
      index: this.esIndex,
      settings: this.esSettings
    });
  }

  indexExists() {
    return this.adapter.indexExists(this.esIndex);
  }

  indexDocument({ index, type, id=null, document, requestTimeout=30000 }) {
    return this.adapter.indexDocument({
      index,
      type,
      id,
      document,
      requestTimeout
    });
  }

  initMapping() {
    this.logger.info(`Updating mapping for index (${this.esIndex}).`);

    return this.adapter.initIndexMapping({
      index: this.esIndex,
      type: this.esType,
      body: this.esMapping
    });
  }

  updateDocument({ index, type, id, document }) {
    return this.adapter.updateDocument({
      index,
      type,
      id,
      body: {
        doc: document
      }
    });
  }
}

module.exports = {
  AbstractIndexer
};
