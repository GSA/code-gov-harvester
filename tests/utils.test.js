/* global before, beforeEach, describe, it */

const { Utils } = require('../libs/utils');
require('chai').should();

describe('Testing Utils module', function () {
  describe('transformtextToKey', function () {
    it('should return a latinized version of the text', function () {
      const testData = 'Code Gov API';
      const expected = 'code_gov_api';

      Utils.transformStringToKey(testData)
        .should.be.equal(expected);
    });
  });
  describe('flatten mapping properties', function () {
    let mappings;
    before(function () {
      mappings = require('../config/indexes_configs/repo/mapping.json');
    });
    it('should return a flattened version of the passed mapping object', function () {
      const expected = {
        'repo.repoID': 'keyword',
        'repo.agency.name': 'text',
        'repo.agency.acronym': 'keyword',
        'repo.agency.website': 'keyword',
        'repo.agency.codeUrl': 'keyword',
        'repo.agency.requirements.agencyWidePolicy': 'float',
        'repo.agency.requirements.openSourceRequirement': 'float',
        'repo.agency.requirements.inventoryRequirement': 'float',
        'repo.agency.requirements.schemaFormat': 'float',
        'repo.agency.requirements.overallCompliance': 'float',
        'repo.measurementType.method': 'keyword',
        'repo.measurementType.ifOther': 'text',
        'repo.status': 'keyword',
        'repo.vcs': 'keyword',
        'repo.repositoryURL': 'keyword',
        'repo.targetOperatingSystems': 'keyword',
        'repo.name': 'text',
        'repo.version': 'keyword',
        'repo.organization': 'text',
        'repo.homepageURL': 'keyword',
        'repo.downloadURL': 'keyword',
        'repo.description': 'text',
        'repo.events': 'text',
        'repo.tags': 'text',
        'repo.languages': 'text',
        'repo.contact.name': 'text',
        'repo.contact.email': 'text',
        'repo.contact.twitter': 'text',
        'repo.contact.phone': 'text',
        'repo.partners.name': 'text',
        'repo.partners.email': 'text',
        'repo.permissions.licenses.name': 'text',
        'repo.permissions.licenses.URL': 'keyword',
        'repo.permissions.usageType': 'text',
        'repo.permissions.exemptionText': 'text',
        'repo.laborHours': 'integer',
        'repo.relatedCode.name': 'text',
        'repo.relatedCode.URL': 'keyword',
        'repo.reusedCode.name': 'text',
        'repo.reusedCode.URL': 'keyword',
        'repo.disclaimerURL': 'keyword',
        'repo.disclaimerText': 'text',
        'repo.additionalInformation': 'object',
        'repo.date.created': 'date',
        'repo.date.lastModified': 'date',
        'repo.date.metadataLastUpdated': 'date',
        'repo.score': 'integer'
      };
      Utils.getFlattenedMappingProperties(mappings)
        .should.be.deep.equal(expected);
    });

    it('should return a grouped flattened version of the passed mapping object ', function () {
      const expected = {
        "keyword": [
          "repo.repoID",
          "repo.agency.acronym",
          "repo.agency.website",
          "repo.agency.codeUrl",
          "repo.measurementType.method",
          "repo.status",
          "repo.vcs",
          "repo.repositoryURL",
          "repo.targetOperatingSystems",
          "repo.version",
          "repo.homepageURL",
          "repo.downloadURL",
          "repo.permissions.licenses.URL",
          "repo.relatedCode.URL",
          "repo.reusedCode.URL",
          "repo.disclaimerURL"
        ],
        text: [
          'repo.agency.name',
          'repo.measurementType.ifOther',
          'repo.name',
          'repo.organization',
          'repo.description',
          'repo.events',
          'repo.tags',
          'repo.languages',
          'repo.contact.name',
          'repo.contact.email',
          'repo.contact.twitter',
          'repo.contact.phone',
          'repo.partners.name',
          'repo.partners.email',
          'repo.permissions.licenses.name',
          'repo.permissions.usageType',
          'repo.permissions.exemptionText',
          'repo.relatedCode.name',
          'repo.reusedCode.name',
          'repo.disclaimerText'
        ],
        nested: [
          'repo.partners',
          'repo.permissions.licenses',
          'repo.relatedCode',
          'repo.reusedCode'
        ],
        float:[
          'repo.agency.requirements.agencyWidePolicy',
          'repo.agency.requirements.openSourceRequirement',
          'repo.agency.requirements.inventoryRequirement',
          'repo.agency.requirements.schemaFormat',
          'repo.agency.requirements.overallCompliance'
        ],
        integer: [
          'repo.score',
          'repo.laborHours'
        ],
        object: [
          'repo.additionalInformation'
        ],
        date: [
          'repo.date.created',
          'repo.date.lastModified',
          'repo.date.metadataLastUpdated'
        ]
      };

      Utils.getFlattenedMappingPropertiesByType(mappings)
        .should.be.deep.equal(expected);
    });
  });
  describe('omit keys', function () {
    let testObject;

    beforeEach(function () {
      testObject = {
        '_id': '20394uq',
        'name': 'Froilan Irizarry',
        'email': 'persona@somewhere.com',
        'age': 36
      };
    });
    it('should return object without the excluded keys using omitDeepKeys', function () {
      const excludeKeys = ['age'];
      const expectedObject = {
        '_id': '20394uq',
        'name': 'Froilan Irizarry',
        'email': 'persona@somewhere.com'
      };
      Utils.omitDeepKeys(testObject, excludeKeys)
        .should.be.deep.equal(expectedObject);
    });
    it('should return object without private keys (begin with _) using omitPrivateKeys', function () {
      const expectedObject = {
        'name': 'Froilan Irizarry',
        'email': 'persona@somewhere.com',
        'age': 36
      };
      Utils.omitPrivateKeys(testObject)
        .should.be.deep.equal(expectedObject);
    });
  });
  describe('getCodeJsonVersion', function() {
    let codeJson;
    before(function() {
      const description = "A hosted, shared-service that provides an API key, " +
        "analytics, and proxy solution for government web services.";

      codeJson = {
        "version": "2.0.0",
        "agency": "GSA",
        "measurementType": {
          "method": "modules"
        },
        "releases": [
          {
            "name": "api.data.gov",
            "description": description,
            "permissions": {
              "licenses": null,
              "usageType": "openSource",
              "exemptionText": null
            },
            "tags": [
              "18F"
            ],
            "contact": {
              "email": "18f@gsa.gov"
            },
            "repositoryURL": "https://github.com/18F/api.data.gov",
            "laborHours": 0,
            "organization": "18F"
          }
        ]
      };
    });
    it('should return code.json version using getCodeJsonVersion', function() {
      const expectedVersion = '2.0.0';

      Utils.getCodeJsonVersion(codeJson).should.be.equal(expectedVersion);
    });
    it('should return code.json repos usign getCodeJsonRepos', function() {
      const description = "A hosted, shared-service that provides an API key, " +
        "analytics, and proxy solution for government web services.";
      const expectedRepos = [
        {
          "name": "api.data.gov",
          "description": description,
          "permissions": {
            "licenses": null,
            "usageType": "openSource",
            "exemptionText": null
          },
          "tags": [
            "18F"
          ],
          "contact": {
            "email": "18f@gsa.gov"
          },
          "repositoryURL": "https://github.com/18F/api.data.gov",
          "laborHours": 0,
          "organization": "18F"
        }
      ];
      Utils.getCodeJsonRepos(codeJson).should.be.deep.equal(expectedRepos);
    });
  });
  describe('isValidEmail', function() {
    it('should return if the passed email has a valid format', function() {
      Utils.isValidEmail('somebody@somewhere.com').should.be.true;
      Utils.isValidEmail('somebodysomewhere.com').should.be.false;
    });
  });
  describe('isValidUrl', function() {
    it('should return if the passed URL has a valid format', function() {
      Utils.isValidUrl('https://code.gov').should.be.true;
      Utils.isValidUrl('https://code_gov').should.be.false;
    });
  });
  describe('removeDupes', function() {
    it('should return collection1 without the duplicates found in collection2', function() {
      const collection1 = [
        {
          "name": "Somebody Somewhere",
          "age": 45,
          "city": "NYC"
        },
        {
          "name": "Somebody Here",
          "age": 32,
          "city": "New Orleans"
        }
      ];
      const collection2 = [
        {
          "name": "Somebody Somewhere",
          "age": 45,
          "city": "NYC"
        },
        {
          "name": "Juan del Pueblo",
          "age": 20,
          "city": "San Juan"
        }
      ];
      const expectedResult = [
        {
          "name": "Somebody Here",
          "age": 32,
          "city": "New Orleans"
        }
      ];

      Utils.removeDupes(collection1, collection2).should.be.deep.equal(expectedResult);
    });
  });
  describe('getFieldWeight', function() {
    it('should return weight value of field passed', function() {

      Utils.getFieldWeight('name').should.be.equal(10);
      Utils.getFieldWeight('repositoryURL').should.be.equal(10);
      Utils.getFieldWeight('disclaimerURL').should.be.equal(3);

    });
  });
  describe('getScore', function() {
    it('should return object with new score', function() {
      const target1 = {
        name: 'Froilan',
        score: 23
      };
      const target2 = {
        name: 'Froilan'
      };

      Utils.getScore(target1, 1).should.be.equal(24);
      Utils.getScore(target2, 2).should.be.equal(2);
    });
  });
  describe('getLoggerRequestSerializer', function() {
    it('should return object with x-api-key removed', function() {
      const fauxRequest = {
        id: '1',
        method: 'GET',
        url: 'http://localhost:3000',
        headers: {
          'x-api-key': 'oh-no-tis-a-token',
          'content-type': 'application/json',
          'user-agent': 'tests'
        },
        connection: {
          remoteAddress: 'localhost',
          remotePort: '3000'
        }
      };
      const expected = {
        id: '1',
        method: 'GET',
        url: 'http://localhost:3000',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'tests'
        },
        remoteAddress: 'localhost',
        remotePort: '3000'
      };
      Utils.getLoggerRequestSerializer(fauxRequest).should.be.deep.equal(expected);
    });
  });
  describe('getLoggerResponseSerializer', function() {
    it('should return object with x-api-key removed', function() {
      const fauxResponse = {
        statusCode: 200,
        _header: {
          'x-api-key': 'oh-no-tis-a-token',
          'content-type': 'application/json',
          'user-agent': 'tests'
        }
      };
      const expected = {
        statusCode: 200,
        header: {
          'content-type': 'application/json',
          'user-agent': 'tests'
        }
      };
      Utils.getLoggerResponseSerializer(fauxResponse).should.be.deep.equal(expected);
    });
  });
});
