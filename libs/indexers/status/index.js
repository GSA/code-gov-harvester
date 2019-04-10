const { AbstractIndexer } = require("../../index_tools");
const crypto = require("crypto");
const { Logger } = require('../../loggers');
const { GMailMailer, SMTPMailer } = require("../../mailer");
const { StatusFormatter }= require("../../utils");

class StatusIndexer extends AbstractIndexer {
  get LOGGER_NAME() {
    return 'status-indexer';
  }

  constructor(adapter, params, config) {
    super(adapter, params);
    this.logger = new Logger( { name: this.LOGGER_NAME, level: config.LOGGER_LEVEL });
    this.sendStatusMail = config.SEND_STATUS_EMAIL;
    this.mailServer = config.EMAIL_SERVER;
    this.mailServerPort = config.EMAIL_SERVER_PORT;
    this.mailFrom = config.EMAIL_FROM;
    this.mailTo = config.EMAIL_TO;
    this.mailCC = config.EMAIL_CC;
    this.mailBCC = config.EMAIL_BCC;
  }

  async readPreviousCounts () {
    const aliasExists = await this.adapter.aliasExists({name: "status"});
    let returnData = {};
    if (aliasExists) {
      try {
        const { data } = await this.adapter.search({index: 'status', type: 'status'});
        if (data && data.length === 1) {
          Object.keys(data[0].statuses).forEach(acronym => {
            returnData[acronym] = data[0].statuses[acronym].counts;
          });
        }
      } catch (error) {
        this.logger.error(error);
        // throw error;  ** Don't throw error if cannot get previous status data **
        }
    }
    return returnData;
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

      if (indexer.sendStatusMail) {
        const allPreviousCounts = await indexer.readPreviousCounts();
        const statusFormatter = new StatusFormatter({report: reporter.report, allPreviousCounts});
        try {
          const mailer = new SMTPMailer({ 
            host: indexer.mailServer, 
            port: indexer.mailServerPort
          });
          await mailer.sendMail({
            from: indexer.mailFrom, 
            to: indexer.mailTo, 
            cc: indexer.mailCC, 
            bcc: indexer.mailBCC, 
            subject: "[CODE.GOV] Repo Harvester Run Report", 
            html: statusFormatter.getFormattedStatus() 
          });
          indexer.logger.debug(`Status E-Mail Sent`);
        } catch(error) {
          indexer.logger.error(`${error} - Sending Status E-Mail`);
          // throw error;  ** Don't throw error if E-Mail cannot be sent **
        }
      }
      return { esIndex: indexInfo.index, esAlias: indexer.esAlias };
    } catch(error) {
      indexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = StatusIndexer;
