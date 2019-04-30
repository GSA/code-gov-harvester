/* global before, describe, it */

const chai = require('chai');
const expect = chai.expect;
const { Formatter } = require('../libs/formatter');

describe('Formatter Test', () => {
  let formatter;
  before(() => {
    const config = {
      LOGGER_LEVEL: 'DEBUG',
      UPDATE_REPO_REGEX: /(1\.0)(\.\d)?/
    };
    formatter = new Formatter(config);
  });
  it('should return a formatted repo for schema version 2.0', async () => {
    const inputRepo = {
      "name": "code-gov-harvester",
      "description": "Stand alone metadata harvester for Code.gov",
      "agency": {
        "name": "General Services Administration",
        "acronym": "GSA",
        "website": "https://gsa.gov/",
        "codeUrl": "https://www.gsa.gov/code.json",
        "fallback_file": "GSA.json",
        "requirements": {
          "agencyWidePolicy": 1,
          "openSourceRequirement": 1,
          "inventoryRequirement": 1,
          "schemaFormat": 0.5,
          "overallCompliance": 1
        },
        "complianceDashboard": true
      },
      "permissions": {
        "licenses": [
          {
            "URL": "https://api.github.com/licenses/cc0-1.0",
            "name": "CC0-1.0"
          }
        ],
        "usageType": "openSource",
        "exemptionText": null
      },
      "tags": [
        "GSA"
      ],
      "contact": {
        "email": "gsa-github.support@gsa.gov"
      },
      "repositoryURL": "https://github.com/GSA/code-gov-harvester",
      "laborHours": 0,
      "organization": "GSA"
    };
    const expectedRepo = {
      "name": "code-gov-harvester",
      "description": "Stand alone metadata harvester for Code.gov",
      "permissions": {
        "licenses": [
          {
            "URL": "https://api.github.com/licenses/cc0-1.0",
            "name": "CC0-1.0"
          }
        ],
        "usageType": "openSource",
        "exemptionText": null
      },
      "tags": [
        "GSA"
      ],
      "contact": {
        "email": "gsa-github.support@gsa.gov"
      },
      "repositoryURL": "https://github.com/GSA/code-gov-harvester",
      "laborHours": 0,
      "organization": "GSA",
      "agency": {
        "name": "General Services Administration",
        "acronym": "GSA",
        "website": "https://gsa.gov/",
        "codeUrl": "https://www.gsa.gov/code.json",
        "fallback_file": "GSA.json",
        "requirements": {
          "agencyWidePolicy": 1,
          "openSourceRequirement": 1,
          "inventoryRequirement": 1,
          "schemaFormat": 0.5,
          "overallCompliance": 1
        },
        "complianceDashboard": true
      },
      "repoID": "gsa_gsa_1_code_gov_harvester",
    };
    const result = await formatter.formatRepo('2.0.0', inputRepo);

    expect(result).to.be.deep.equals(expectedRepo);
  });
});