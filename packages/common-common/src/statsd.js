'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.StatsDController = exports.ProjectTag = void 0;
const hot_shots_1 = require('hot-shots');
var ProjectTag;
(function (ProjectTag) {
  ProjectTag['Commonwealth'] = 'commonwealth';
  ProjectTag['TokenBalanceCache'] = 'token-balance-cache';
})(ProjectTag || (exports.ProjectTag = ProjectTag = {}));
class StatsDController {
  static instance = new StatsDController();
  _client;
  constructor() {
    this._client = new hot_shots_1.StatsD({
      globalTags: { env: process.env.NODE_ENV || 'development' },
      errorHandler: (error) => {
        console.error(`Caught statsd socket error: ${error}`);
      },
    });
  }
  static get() {
    return this.instance._client;
  }
}
exports.StatsDController = StatsDController;
