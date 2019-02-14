const { createLogger, format, transports } = require('winston');
const { combine, label, timestamp, json } = format;

class Logger {

  get label() {
    return "default-logger";
  }

  get level() {
    return "info";
  }

  constructor({ name=undefined, level=undefined }) {

    const logger = createLogger({
      level: level
        ? level
        : process.env.LOGGER_LEVEL
          ? process.env.LOGGER_LEVEL
          : this.level,
      format: combine(
        label({ label: name ? name : this.label }),
        timestamp(),
        json()
      ),
      transports: [ new transports.Console() ]
    });

    this.error = logger.error.bind(logger);
    this.warning = logger.warn.bind(logger);
    this.info = logger.info.bind(logger);
    this.debug = logger.debug.bind(logger);
    this.trace = (method, requestUrl, body, responseBody, responseStatus) => logger.silly({
      method,
      requestUrl,
      body,
      responseBody,
      responseStatus
    });

    this.close = () => {};
  }

}

class ElasticsearchLogger extends Logger {
  get level() {
    return 'info';
  }
  get label() {
    return 'elasticsearch'
  }
}

module.exports = {
  Logger,
  ElasticsearchLogger
};
