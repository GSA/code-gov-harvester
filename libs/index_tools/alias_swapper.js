const { Logger, ElasticsearchLogger } = require("../loggers");
const adapter = require('@code.gov/code-gov-adapter');

/**
 * Class for Swapping out ElasticSearch Aliases
 *
 * @class AliasSwapper
 */
class AliasSwapper {

  /**
   * Creates an instance of AliasSwapper.
   *
   * @constructor
   * @param {object} adapter The search adapter to use for connecting to ElasticSearch.
   * @param {object} config The configuration object to use.
   * @param {object} logger The logger instance to use with the AliasSwapper.
   */
  constructor({ adapter, config, logger }) {
    this.adapter = new adapter({
      hosts: config.ES_HOST,
      logger: ElasticsearchLogger,
      apiVersion: config.ELASTICSEARCH_API_VERSION
    });
    this.logger = logger;
  }

  /**
   * Validates that the supplied alias name exists.
   *
   * @param {string} name
   * @returns {boolean}
   */
  async aliasExists(name) {
    try {
      return await this.adapter.aliasExists({
        name: [name]
      });
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }

  }
  /**
   * Executes the actions generated for the alias swapping.
   *
   * @param {Array<objec>} actions The actions to execute when updating the alias
   * @returns {*}
   */
  async executeActions(actions) {
    this.logger.info(`Swapping aliases.`);

    try {
      return await this.adapter.updateAliases({
        body: {
          actions: actions
        }
      });
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Gets all indexes with the supplied alias.
   *
   * @param {string} alias The index alias name
   * @returns {Array<string>} An array of indices for an alias
   */
  async getIndexesForAlias(alias) {
    this.logger.info(`Getting indexes for alias (${alias}).`);

    try {
      return await this.adapter.getIndexesForAlias({ alias });
    } catch(error) {
      this.logger.trace(error);
      throw error;
    }
  }

  /**
   * Build actions for the alias swapper.
   *
   * @param {object} actionsInfo
   * @param {Array} actionsInfo.indices A collection of indices to remove an alias from.
   * @param {string} actionsInfo.alias The alias to use for the actions.
   * @param {string} actionsInfo.targetIndex The index to set the alias to.
   * @returns {Array} Array with all actions to be perfomed by the alias swapper.
   */
  _buildActions({ indices, alias, targetIndex }) {
    let actions = [];
    for(let index of indices) {
      actions.push({
        remove: { index, alias }
      });
    }
    actions.push({
      add: {
        index: targetIndex,
        alias
      }
    });

    return actions;
  }

  /**
   * Initializes and executes the swapping of aliases for an index
   *
   * @static
   * @param {object} params
   * @param {object} params.adapter The search adapter to use for making requests to ElasticSearch
   * @param {string} params.index The index to swap the alias to.
   * @param {string} params.alias The alias to swap to the targetIndex.
   * @param {object} params.config Configuration object to be used.
   * @param {object} params.logger The logger to use with the AliasSwapper.
   * @returns {Promise}
   */
  static async swapAlias({ adapter, index, alias, config, logger=undefined }) {
    const swapper = new AliasSwapper({
      adapter,
      config,
      logger: logger ? logger : new Logger({ name: 'alias-swapper', level: config.LOGGER_LEVEL })
    });

    swapper.logger.info(`Starting alias swapping.`);
    try {
      const exists = await swapper.aliasExists({ name: alias });
      let indices = [];

      if(exists) {
        indices = await swapper.getIndexesForAlias(alias);
      }
      let actions = swapper._buildActions({ indices, alias, targetIndex: index });

      return await swapper.executeActions(actions);

    } catch(error) {
      swapper.logger.trace(error);
      throw error;
    }
  }
}

if (require.main === module) {
  const logger = new Logger({ name: 'alias-swapper' });
  try {
    if(process.argv.length < 4) {
      throw new Error('Not enough parameters passed. targetIndex and alias are required.')
    }

    const targetIndex = process.argv[2];
    const alias = process.argv[3];

    AliasSwapper.swapAlias({
      adapter: adapter.elasticsearch.ElasticsearchAdapter,
      targetIndex,
      alias,
      config: getConfig(process.env.NODE_ENV),
      logger
    })
      .then(() => logger.info(`Finished swapping alias: ${alias} for index: ${targetIndex}`))
      .catch(error => indexer.logger.error(error));
  } catch(error) {
    logger.error(`There was an error executing the alias-swapper. ${error}`);
  }
}

module.exports = {
  AliasSwapper
};
