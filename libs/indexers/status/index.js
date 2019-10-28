const { AbstractIndexer } = require("../../index_tools");
const crypto = require("crypto");
const { Logger } = require('../../loggers');
const { SMTPMailer } = require("../../mailer");
const { Utils, StatusFormatter }= require("../../utils");

class StatusIndexer extends AbstractIndexer {
  get LOGGER_NAME() {
    return 'status-indexer';
  }

  constructor(adapter, params, config) {
    super(adapter, params);
    this.logger = new Logger( { name: this.LOGGER_NAME, level: config.LOGGER_LEVEL });
    this.sendStatusMail = config.SEND_STATUS_EMAIL;
    this.sendSummaryEveryDay = config.SEND_SUMMARY_EVERYDAY;
    this.mailServer = config.EMAIL_SERVER;
    this.mailServerPort = config.EMAIL_SERVER_PORT;
    this.mailServerSecure = config.EMAIL_SERVER_SECURE;
    this.mailServerUser = config.EMAIL_SERVER_USER;
    this.mailServerPassword = config.EMAIL_SERVER_PASSWORD;
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

  async sendStatusEMails(reporter) {
    if (this.sendStatusMail) {
      const allPreviousCounts = await this.readPreviousCounts();
      const statusFormatter = new StatusFormatter({report: reporter.report, allPreviousCounts});
      try {
        const mailer = new SMTPMailer({ 
          host: this.mailServer, 
          port: this.mailServerPort,
          secure: this.mailServerSecure,
          user: this.mailServerUser,
          pass: this.mailServerPassword
        });
        let html = statusFormatter.getFormattedStatus("daily");
        if (this.sendSummaryEveryDay || Utils.isLastDayOfMonth()) {
          html += statusFormatter.getFormattedStatus("monthEnd");
        }
        await mailer.sendMail({
          from: this.mailFrom, 
          to: this.mailTo, 
          cc: this.mailCC, 
          bcc: this.mailBCC, 
          subject: "[CODE.GOV] Harvester run report", 
          html: html 
        });
        this.logger.debug(`Status E-Mail(s) Sent`);
      } catch(error) {
        this.logger.error(`${error} - Sending Status E-Mail`);
        // throw error;  ** Don't throw error if E-Mail cannot be sent **
      }
    }
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

      await indexer.sendStatusEMails(reporter);

      return { esIndex: indexInfo.index, esAlias: indexer.esAlias };
    } catch(error) {
      indexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = StatusIndexer;
