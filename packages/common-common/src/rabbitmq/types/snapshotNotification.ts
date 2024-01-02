import type { ISnapshotNotification } from '@hicommonwealth/core';
import type { RmqMsgNamespace } from 'common-common/src/rabbitmq/types';
import { RmqMsgFormatError } from 'common-common/src/rabbitmq/types';

export const RmqSnapshotNotification: RmqMsgNamespace<ISnapshotNotification> = {
  getInvalidFormatError(notif: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following Snapshot Notification is improperly formatted: ${JSON.stringify(
        notif,
      )}`,
    );
  },

  isValidMsgFormat(data: any): data is ISnapshotNotification {
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

  checkMsgFormat(data: any): void {
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

export namespace RmqSnapshotNotification {
  export type RmqMsgType = ISnapshotNotification;
}
