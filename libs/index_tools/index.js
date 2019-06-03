const { AliasSwapper } = require('./alias_swapper');
const { IndexOptimizer } = require('./index_optimizer');
const { IndexCleaner } = require('./index_cleaner');
const { AbstractIndexer } = require('./abstract_indexer');

module.exports = {
  AliasSwapper,
  IndexOptimizer,
  IndexCleaner,
  AbstractIndexer
};
