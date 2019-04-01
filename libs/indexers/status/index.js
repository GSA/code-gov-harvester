const { AbstractIndexer } = require("../../index_tools");
const crypto = require("crypto");
const { Logger } = require('../../loggers');
const { GMailMailer } = require("../../mailer");

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

  _convertToHTMLTRs({agencies, caption="", type=""}) {
    if (agencies.length > 0) {
      agencies.sort((a, b) => {
        let acronymA = a.acronym.toLowerCase(), acronymB = b.acronym.toLowerCase();
        return (acronymA < acronymB) ? -1 : (acronymA > acronymB) ? 1 : 0;
      });
      let bgColor = type.toLowerCase() === "error" ? "#F5A9A9"
        : type.toLowerCase() === "warning" ? "#F2F5A9" 
        : type.toLowerCase() === "duplicates" ? "#A9E2F3" 
        : "#FFFFFF";
      
      let html = "";
      if (caption) {
        html = `<tr style="background-color: ${bgColor}; font-weight: bold">
        <td colspan="5">${caption}</td>
        </tr>`;        
      }

      agencies.forEach(agency => {
        let counts = [];
        Object.keys(agency.counts).forEach(usageType => {
           counts.push(usageType + ": <em>" + agency.counts[usageType] + "</em>");
        });
        html += `<tr style="background-color: ${bgColor}">
         <td>${agency.acronym}</td>
         <td>${(agency.wasRemoteJsonRetrived ? "Yes" : "No")}</td>
         <td>${(agency.wasRemoteJsonParsed ? "Yes" : "No")}</td>
         <td>${(agency.wasFallbackUsed ? "Yes" : "No")}</td>
         <td>${counts.join(" | ")}</td>
         </tr>`;
      });
      return html;
    }
    return "";
  }

  getStatusHTML({report}) {
    let agencies = [];
    Object.keys(report.statuses).forEach(acronym => {
      const { wasFallbackUsed, wasRemoteJsonRetrived, wasRemoteJsonParsed, counts } = report.statuses[acronym];
      agencies.push({acronym, wasFallbackUsed, wasRemoteJsonRetrived, wasRemoteJsonParsed, counts});
    });
    let html = `<h3>CODE.GOV Repository Harvester Execution Summary</h3>
      <h4>Time: ${report.timestamp}</h4>
      <table border="1" cellspacing="0" cellpadding="2">
        <tr style="background-color: #E6E6E6">
        <th>Agency<br />Acronym</th>
        <th>Retrieved Remote<br />code.json</th>
        <th>Parsed Remote<br />code.json</th>
        <th>Fallback<br />Used</th>
        <th>Repository Counts</th> 
        </tr>`;
    html += this._convertToHTMLTRs({ agencies: agencies.filter(agency => !agency.wasRemoteJsonRetrived && !agency.wasFallbackUsed), caption: "No remote code.json file.  Missing fallback file or errors while processing fallback file.", type: "error" });
    html += this._convertToHTMLTRs({ agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && !agency.wasRemoteJsonParsed && !agency.wasFallbackUsed), caption: "Errors while processing remote code.json file.  Missing fallback file or errors while processing fallback file.", type: "error" });
    html += this._convertToHTMLTRs({ agencies: agencies.filter(agency => !agency.wasRemoteJsonRetrived && agency.wasFallbackUsed), caption: "No remote code.json file.  Used fallback file successfully.", type: "warning" });
    html += this._convertToHTMLTRs({ agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && !agency.wasRemoteJsonParsed && agency.wasFallbackUsed), caption: "Errors while processing Remote code.json file.  Used fallback file successfully.", type:"warning" });
    html += this._convertToHTMLTRs({ agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && agency.wasRemoteJsonParsed && agency.counts.duplicates), caption: "Used remote code.json successfully - with duplicates.", type: "duplicates" });
    html += this._convertToHTMLTRs({ agencies: agencies.filter(agency => agency.wasRemoteJsonRetrived && agency.wasRemoteJsonParsed && !agency.counts.duplicates), caption: "Used remote code.json successfully." });
    html += `</table>`;
    return html 
  }

  static async init(reporter, adapter, esParams, config) {
    const indexer = new StatusIndexer(adapter, esParams, config);
    const html = indexer.getStatusHTML(reporter);

    indexer.logger.info(`Started indexing (${indexer.esType}) indices.`);

    try {
      const exists = await indexer.indexExists();

      if(exists) {
        indexer.deleteIndex();
      }
      const indexInfo = await indexer.initIndex();
      await indexer.initMapping();
      await indexer.indexStatus(reporter);

      try {
        // TBD: To externalize user and password
        const mailer = new GMailMailer({user: '****@gmail.com', pass: '*!*!*!*!*'});
        // TBD: To externalize from, to, subject
        await mailer.sendMail({from: '****@gmail.com', to: 'someone@some-domain.com', subject: "SUBJECT Details", html: html });
      } catch(error) {
        indexer.logger.error(error);
        //throw error;  **Don't throw error if E-Mail cannot be sent **
      }
      return { esIndex: indexInfo.index, esAlias: indexer.esAlias };
    } catch(error) {
      indexer.logger.error(error);
      throw error;
    }
  }
}

module.exports = StatusIndexer;
