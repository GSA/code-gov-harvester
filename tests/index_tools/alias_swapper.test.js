const expect = require('chai').expect;
const nock = require('nock');
const { AliasSwapper } = require('../../libs/index_tools')
const adapters = require('@code.gov/code-gov-adapter');

describe('Alias Swapper tests', () => {
  let adapter;
  let testIndex;
  let testAlias;
  let testConfig;
  let aliasSwapper;
  let aliasUrl;
  let mockJsonContentType;

  before(() => {
    mockJsonContentType = { "Content-Type": "application/json" };
    aliasUrl = `/_alias/${testAlias}`;

    adapter = adapters.elasticsearch.ElasticsearchAdapter;
    testIndex = 'test-index-1234';
    testAlias = 'testAlias';
    testConfig = {
      ES_HOST: 'http://localhost:9200',
      LOGGER_LEVEL: 'debug',
      ELASTICSEARCH_API_VERSION: '5.6'
    };
    aliasSwapper = new AliasSwapper({ adapter, config:testConfig });
  });

  describe('swap aliases', () => {
    before(() => {
      nock('http://localhost:9200/')
        .persist()
        .head(aliasUrl)
        .reply(200, true)
        .post('/_aliases',
          { "actions" : [{ "add":  { "index": "terms20181125_122432", "alias": "test" }}] },
          mockJsonContentType
        )
        .reply(200, { "acknowledged": true });
        // .head(aliasUrl)
        // .reply(200, true);
    })
    it('should return an unchanged Elasticsearch response object', async () => {
      const expectedResult = { "acknowledged": true };
      const response = await AliasSwapper.swapAlias({
        adapter,
        index: testIndex,
        alias: testAlias,
        config: testConfig
      });
      expect(response).to.deep.equal(expectedResult);
    });
  });

  describe.skip('verify if alias exists', () => {
    before(() => {
      nock('http://localhost:9200/')
        .head(aliasUrl)
        .reply(200, true);
    });
    it('should ', async () => {
      const exists = await aliasSwapper.aliasExists(testAlias);
      expect(exists).to.equal(true);
    });
  });
});
