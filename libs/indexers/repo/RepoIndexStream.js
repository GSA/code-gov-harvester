const { Writable } = require("stream");
const { Logger } = require("../../loggers");

class RepoIndexerStream extends Writable {
  constructor(indexer, config) {
    super({
      objectMode: true
    });
    this.indexer = indexer;
    this.logger = new Logger({ name: 'repo-indexer-stream', level: config.LOGGER_LEVEL });
  }

  _indexRepo(repo) {
    return this.indexer.indexDocument({
      index: this.indexer.esIndex,
      type: this.indexer.esType,
      id: repo.repoID,
      document: repo,
      requestTimeout: 90000
    });
  }

  _write(repo, enc, next) {
    this._indexRepo(repo)
      .then((response, status) => {
        if (status) {
          this.logger.debug('indexer.indexDocument - Status', status);
        }

        this.indexer.indexCounter++;

        return next(null, response);
      })
      .catch(err => {
        this.logger.error(err);
        return next(err, null);
      });
  }
}

module.exports = RepoIndexerStream;
