/******************************************************************************

  REPORTER: a service which tracks the status of fetching/indexing and writes
  a report as a result

******************************************************************************/

const Jsonfile = require("jsonfile");
const { Logger } = require("../loggers");
const getConfig = require("../../config");
const StatusIndexer = require("../indexers/status");
const adapters = require('@code.gov/code-gov-adapter');
const { AliasSwapper, IndexCleaner, IndexOptimizer} = require('../index_tools');

const DAYS_TO_KEEP = 7;
class Reporter {

  constructor(config, loggerName) {
    this.logger = new Logger({ name: loggerName, level: config.LOGGER_LEVEL });
    this.config = config;
    this.report = {
      timestamp: (new Date()).toString(),
      statuses: {}
    };
  }

  _createReportItemIfDoesntExist(itemName) {
    // creates the report item if it doesn't already exist
    if (this.report.statuses[itemName] === undefined) {
      this.report.statuses[itemName] = {
        status: "",
        issues: [],
        version: "",
        metadata: {}
      };
    }
  }

  //deprecated
  reportStatus(itemName, status) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["status"] = status;
  }

  reportIssues(itemName, issuesObj) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["issues"].push(issuesObj);
  }

  reportVersion(itemName, version) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["version"] = version;
  }

  reportMetadata(itemName, metadata) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["metadata"] = metadata;
  }

  reportRequirements(itemName, requirements) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["requirements"] = requirements;
  }

  reportCodeJsonFetchResult(itemName, fetchResult) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["fetchResult"] = fetchResult;
  }

  reportFallbackUsed(itemName, wasFallbackUsed) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["wasFallbackUsed"] = wasFallbackUsed;
  }

  reportRemoteJsonRetrived(itemName, wasRemoteJsonRetrived) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["wasRemoteJsonRetrived"] = wasRemoteJsonRetrived;
  }

  reportRemoteJsonParsed(itemName, wasRemoteJsonParsed) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["wasRemoteJsonParsed"] = wasRemoteJsonParsed;
  }

  reportCounts(itemName, counts) {
    this._createReportItemIfDoesntExist(itemName);
    this.report.statuses[itemName]["counts"] = counts;
  }

  async indexReport() {
    const params = {
      esAlias: this.config.STATUS_INDEX_CONFIG.esAlias,
      esType: this.config.STATUS_INDEX_CONFIG.esType,
      esMapping: this.config.STATUS_INDEX_CONFIG.mappings,
      esSettings: this.config.STATUS_INDEX_CONFIG.settings,
      esHosts: this.config.ES_HOST,
      esApiVersion: this.config.ELASTICSEARCH_API_VERSION
    };
    const adapter = adapters.elasticsearch.ElasticsearchAdapter;
    try {
      const indexInfo = await StatusIndexer.init(this, adapter, params, this.config);

      await IndexOptimizer.optimizeIndex({
        adapter,
        index: indexInfo.esIndex,
        config:this.config
      });
      await AliasSwapper.swapAlias({
        adapter,
        index: indexInfo.esIndex,
        alias: indexInfo.esAlias,
        config: this.config
      });
      await IndexCleaner.cleanIndexes({
        adapter,
        alias: indexInfo.esAlias,
        dayToKeep: DAYS_TO_KEEP,
        config: this.config
      });

      return indexInfo;

    } catch(error) {
      this.logger.error(error);
      throw error;
    }
  }

  writeReportToFile() {
    return new Promise((fulfill, reject) => {
      this.logger.info("Writing report to file...");
      this.report.timestamp = (new Date()).toString();

      Jsonfile.writeFile(this.config.REPORT_FILEPATH, this.report, {spaces: 2}, (err) => {
        if (err) {
          reject(err);
        }
        fulfill(err);
      });
    });
  }
}

module.exports = new Reporter(getConfig(process.env.NODE_ENV), "reporter" );
