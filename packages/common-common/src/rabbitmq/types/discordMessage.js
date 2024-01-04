'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rmqDiscordMessage = void 0;
const types_1 = require('common-common/src/rabbitmq/types');
exports.rmqDiscordMessage = {
  getInvalidFormatError(event) {
    return new types_1.RmqMsgFormatError(
      `The following snapshot event is improperly formatted: ${JSON.stringify(
        event,
      )}`,
    );
  },
  isValidMsgFormat(data) {
    return (
      typeof data.content === 'string' &&
      typeof data.channel_id === 'string' &&
      typeof data.parent_channel_id === 'string'
    );
  },
  /**
   * This function combines the isValidMsgFormat and getInvalidFormatError functions. Essentially this function will
   * check the given data format and throw the RmqMsgFormatError if the format is invalid.
   * @param data The raw message from RabbitMQ
   */
  checkMsgFormat(data) {
    const valid = this.isValidMsgFormat(data);
    if (!valid) throw this.getInvalidFormatError(data);
  },
};
