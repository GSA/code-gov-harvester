const getConfig = require('../../config');
const { Logger } = require('../loggers');
const BodyBuilder = require('bodybuilder');
const adapters = require('@code.gov/code-gov-adapter');

function getBody(from, size) {
  const bodybuilder = new BodyBuilder();
  return bodybuilder
    .from(from)
    .size(size)
    .aggregation('max', 'score', 'max_data_score' )
    .aggregation('min', 'score', 'min_data_score' )
    .build();
}
function normalizeScores(data, maxScore, minScore) {
  return data.map(item => {
    const normalizedScore = (item.score - minScore) / (maxScore - minScore) * 10;
    item.score = normalizedScore.toFixed(1);
    return item;
  });
}
async function getRepos({from=0, size=100, collection=[], adapter, index}) {
  let body = getBody(from, size);

  const {total, data, aggregations} = await adapter.search({ index, type: 'repo', body});

  const normalizedData = normalizeScores(data, aggregations.max_data_score.value, aggregations.min_data_score.value);

  const delta = total - from;

  if(delta < size) {
    return {total, data: collection, aggregations };
  }
  from += size;

  return await getRepos({ from, size, collection: collection.concat(normalizedData), adapter, index });
}
async function normalizeRepoScores({ adapter, index, type, config, log=undefined}) {
  const elasticSearchAdapter = new adapter({ hosts: config.ES_HOST, logger: Logger });
  const logger = log
    ? log
    : new Logger({ name: 'data-score-normalizer', level: config.LOGGER_LEVEL });

  logger.info('Fetching repos');
  const {total, data} = await getRepos({from:0, size: 100, adapter: elasticSearchAdapter, index});
  logger.debug(`Fetched ${total} items from index: ${index}`);

  try {
    for(let document of data) {
      await elasticSearchAdapter.updateDocument({
        index,
        type,
        id: document.repoID,
        document
      });
    }
    logger.info(`Updated ${total} repos`);
  } catch(error) {
    throw error;
  }
}

if(require.main === module) {
  const config = getConfig(process.env.NODE_ENV);
  const adapter = adapters.elasticsearch.ElasticsearchAdapter;
  const log = new Logger({ name: 'data-score-normalization', level: config.LOGGER_LEVEL });

  if(process.argv.length < 4) {
    throw new Error('Not enough parameters passed. targetIndex and alias are required.')
  }

  const index = process.argv[2]
  const type = process.argv[3]

  normalizeRepoScores({ adapter, index, type , config, log })
    .then(() => logger.info('Finished score normalization.'))
    .catch(error => logger.error(error));
}

module.exports = {
  normalizeRepoScores
};
