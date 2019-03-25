const { AbstractIndexer } = require("../../index_tools");
const crypto = require("crypto");
const { Logger } = require('../../loggers');

class StatusIndexer extends AbstractIndexer {
  get LOGGER_NAME() {
    return 'status-indexer';
  }

  constructor(adapter, params, config) {
    super(adapter, params);
    this.logger = new Logger( { name: this.LOGGER_NAME, level: config.LOGGER_LEVEL });
  }

  indexStatus (reporter) {
    const idHash = crypto.createHash('md5')
      .update(JSON.stringify(reporter.report), 'utf-8')
      .digest('hex');

    reporter.report.timestamp = (new Date()).toString();
    reporter.report.statusID = idHash;
    return this.indexDocument({
      index: this.esIndex,
      type: this.esType,
      id: idHash,
      document: JSON.stringify(reporter.report)
    });
  }

  static async init(reporter, adapter, esParams, config) {
    const indexer = new StatusIndexer(adapter, esParams, config);

    indexer.logger.info(`Started indexing (${indexer.esType}) indices.`);

    try {
      const exists = await indexer.indexExists();

      if(exists) {
        indexer.deleteIndex();
      }
      const indexInfo = await indexer.initIndex();
      await indexer.initMapping();
      await indexer.indexStatus(reporter);

      return { esIndex: indexInfo.index, esAlias: indexer.esAlias };
    } catch(error) {
      indexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = StatusIndexer;
