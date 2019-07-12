/* global before, describe, it */

const chai = require('chai');
const expect = chai.expect;
const { Formatter } = require('../libs/formatter');

describe('Formatter Test', () => {
  let formatter;
  let inputRepo;

  before(() => {
    const config = {
      LOGGER_LEVEL: 'DEBUG',
      UPDATE_REPO_REGEX: /(1\.0)(\.\d)?/
    };
    formatter = new Formatter(config);
    inputRepo = {
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
  });
  describe('formatRepo', () => {
    it('should return a formatted repo for schema version 2.0', async () => {

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
        "repoID": "gsa_gsa_1_code_gov_harvester"
      };
      const result = await formatter.formatRepo('2.0.0', inputRepo);

      expect(result).to.be.deep.equals(expectedRepo);
    });
  });

  describe('_formatDate', () => {
    it('should not throw an error', () => expect(() => formatter._formatDate('2016-08-01')).to.not.throw());
    it('should parse 2016-08-01', () => expect(() => formatter._formatDate('2016-08-01')).to.not.throw());
    it('should fail parse: 2000-13-01', () => expect(() => formatter._formatDate('2000-13-01')).to.throw());
    it('should parse ISO 8601 + offset: 2018-07-01T01:01:01+04:00', () => expect(() => formatter._formatDate('2018-07-01T01:01:01+04:00')).to.not.throw());
    it('should parse ISO 8601 2016-11-29T00:16:44.628Z', () => expect(() => formatter._formatDate('2016-11-29T00:16:44.628Z')).to.not.throw());
    it('should fail parse: 42736', () => expect(() => formatter._formatDate('42736')).to.throw());
    it('should fail parse: 2013', () => expect(() => formatter._formatDate('2013')).to.throw());
    it('should throw an error', () => expect(formatter._formatDate).to.throw());
  });
  describe('_getUsageCode', () => {
    it('should return a usage code', () => expect(formatter._getUsageCode(inputRepo)).to.equal('1'));
  });
});
