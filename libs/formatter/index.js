const JsonFile = require('jsonfile');
const { Logger } = require("../loggers");
const moment = require("moment");
const path = require('path');
const { Utils } = require("../utils");

class Formatter {
  constructor(config) {
    this.logger = new Logger({ name: "formatter", level: config.LOGGER_LEVEL });
    this.config = config;
    this.exemptionsTexts = JsonFile.readFileSync(path.join(__dirname, './repo_upgrade_texts.json'));
    this.exemptionsCodes = JsonFile.readFileSync(path.join(__dirname, './repo_codes.json'));
  }

  _formatDate(date) {
    const ISO8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?))$/i;
    let result = null;

    // Check for ISO 8601 formatting (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss[Z|+offset])
    if (ISO8601.test(date)) {
      result = moment(date);
    }

    if (result === null || !result.isValid()) throw `Bad date format: ${date}`;

    return result.utc().toJSON();
  }

  _formatDates(repo) {
    if (repo.date) {
      for (const key in repo.date) {
        try {
          repo.date[key] = this._formatDate(repo.date[key]);
        } catch(error) {
          repo.date[key] = null;
          this.logger.info(`Repo ${repo.name}(${repo.repoID}): ${key}: ${error}`);
        }
      }
    }
  }

  _getUsageTypeExemptionText(repo) {
    const exemptionTexts = this.exemptionsTexts;
    let usageType, exemptionText;

    if (repo.openSourceProject === 1) {
      usageType = 'openSource';
      exemptionText = exemptionTexts.openSource;
    } else if (repo.governmentWideReuseProject === 1) {
      usageType = 'governmentWideReuse';
      exemptionText = exemptionTexts.governmentWideReuse;
    } else if (String(repo.exemption) === '1') {
      usageType = 'exemptByLaw';
      exemptionText = exemptionTexts.exemptByLaw;
    } else if (String(repo.exemption) === '2') {
      usageType = 'exemptByNationalSecurity';
      exemptionText = exemptionTexts.exemptByNationalSecurity;
    } else if (String(repo.exemption) === '3') {
      usageType = 'exemptByAgencySystem';
      exemptionText = exemptionTexts.exemptByAgencySystem;
    } else if (String(repo.exemption) === '4') {
      usageType = 'exemptByAgencyMission';
      exemptionText = exemptionTexts.exemptByAgencyMission;
    } else if (String(repo.exemption) === '5') {
      usageType = 'exemptByCIO';
      exemptionText = exemptionTexts.exemptByCIO;
    } else {
      usageType = null;
      exemptionText = null;
    }

    return {usageType, exemptionText};
  }

  _upgradeOptionalFields(repo) {
    repo.vcs = repo.vcs || '';
    repo.disclaimerText = repo.disclaimerText || '';
    repo.disclaimerURL = repo.disclaimerURL || '';
    repo.relatedCode = [{
      codeName: '',
      codeURL: '',
      isGovernmentRepo: false
    }];
    repo.reusedCode = [{
      name: '',
      URL: ''
    }];
    repo.targetOperatingSystems = repo.targetOperatingSystems
      ? repo.targetOperatingSystems
      : ['other'];
    repo.additionalInformation = repo.additionalInformation
      ? repo.additionalInformation
      : { additionalNotes: null };
  }
  _upgradeToPermissions(repo) {

    const { usageType, exemptionText } = this._getUsageTypeExemptionText(repo);
    repo.permissions = {
      usageType,
      exemptionText,
      licenses: [{
        URL: repo.license ? repo.license: '',
        name: ''
      }]
    };

    delete repo.license;
    delete repo.openSourceProject;
    delete repo.governmentWideReuseProject;
    delete repo.exemption;
    delete repo.exemptionText;
  }
  _upgradeUpdatedToDate(repo) {
    let lastModified = '',
      metadataLastUpdated = '';

    if (repo.updated) {
      if (repo.updated.sourceCodeLastModified) {
        lastModified = this._formatDate(repo.updated.sourceCodeLastModified);
      }

      if (repo.updated.metadataLastUpdated) {
        metadataLastUpdated = this._formatDate(repo.updated.metadataLastUpdated);
      }

      delete repo.updated;
    }

    repo.date = {
      created: '',
      lastModified: lastModified || null,
      metadataLastUpdated: metadataLastUpdated || null
    };
  }
  _upgradeProject(repo) {
    repo.laborHours = null;
    repo.repositoryURL = repo.repository ? repo.repository : '';
    repo.homepageURL = repo.homepage ? repo.homepage : '';

    delete repo.repository;
    delete repo.homepage;

    this._upgradeToPermissions(repo);
    this._upgradeUpdatedToDate(repo);
    this._upgradeOptionalFields(repo);

    return repo;
  }

  _getUsageCode(repo) {
    const { usageType } = repo.permissions ? repo.permissions : {"usageType": null};
    return (usageType && this.exemptionsCodes[usageType])
      ? this.exemptionsCodes[usageType]
      : this.exemptionsCodes["other"];
  }

  _formatRepo(repo){
    // add repoId using a combination of agency acronym, organization, usage Type and
    // repo name fields
    let repoId = Utils.transformStringToKey(
      [repo.agency.acronym, repo.organization, this._getUsageCode(repo), repo.name].join("_")
    );
    repo["repoID"] = repoId;

    // remove `id` from agency object
    if (repo.agency && repo.agency.id) {
      delete repo.agency.id;
    }

    // remove `partners` if incorrect type, code-gov-validator crashes if malformed
    if (repo.hasOwnProperty('partners') && !(repo.partners instanceof Array)) {
      delete repo.partners;
    }

    this._formatDates(repo);

    return repo;
  }

  formatRepo(schemaVersion = '2.0.0', repo) {
    return new Promise((resolve, reject) => {
      let formattedRepo;
      try {
        if(schemaVersion.match(this.config.UPDATE_REPO_REGEX)) {
          this._upgradeProject(repo);
        }

        formattedRepo = this._formatRepo(repo);

        this.logger.debug('formatted repo', formattedRepo);
      } catch (error) {
        this.logger.error(`Error when formatting repo (${repo.name}): ${error}`);
        reject(error);
      }

      this.logger.debug(`Formatted repo ${repo.name} (${repo.repoID}).`);
      resolve(repo);
    });

  }
}

module.exports = {
  Formatter
};
