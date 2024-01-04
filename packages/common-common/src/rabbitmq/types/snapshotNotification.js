'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.RmqSnapshotNotification = void 0;
const types_1 = require('common-common/src/rabbitmq/types');
exports.RmqSnapshotNotification = {
  getInvalidFormatError(notif) {
    return new types_1.RmqMsgFormatError(
      `The following Snapshot Notification is improperly formatted: ${JSON.stringify(
        notif,
      )}`,
    );
  },
  isValidMsgFormat(data) {
    return !!(
      data.id &&
      typeof data.id === 'string' &&
      data.title &&
      typeof data.title === 'string' &&
      data.body &&
      typeof data.body === 'string' &&
      data.choices &&
      Array.isArray(data.choices) &&
      data.space &&
      typeof data.space === 'string'
    );
  },
  checkMsgFormat(data) {
    const valid = this.isValidMsgFormat(data);
    if (!valid) {
      console.log(
        `The following Snapshot Notification is improperly formatted: ${JSON.stringify(
          data,
        )}`,
      );
      throw this.getInvalidFormatError(data);
    }
  },
};
