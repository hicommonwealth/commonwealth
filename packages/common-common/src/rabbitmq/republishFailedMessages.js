'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.RepublishFailedMessages = void 0;
class RepublishFailedMessages {
  _rmqController;
  _models;
  _intervalMS;
  _timeoutHandle;
  constructor(_rmqController, _models, _intervalMS) {
    this._rmqController = _rmqController;
    this._models = _models;
    this._intervalMS = _intervalMS;
    if (_intervalMS <= 0) {
      throw new Error('Interval (in milliseconds) must be greater than 0');
    }
    if (!_rmqController.initialized) {
      throw new Error('RabbitMQ Controller must be initialized');
    }
  }
  run() {
    this._timeoutHandle = global.setInterval(
      () => this.job(),
      this._intervalMS,
    );
  }
  close() {
    clearInterval(this._timeoutHandle);
    this._timeoutHandle = undefined;
  }
}
exports.RepublishFailedMessages = RepublishFailedMessages;
