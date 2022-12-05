import {RmqMsgFormatError, RmqMsgNamespace} from "common-common/src/rabbitmq";
import {SnapshotNotification} from "../../../../commonwealth/shared/types"

export const RmqSnapshotNotification: RmqMsgNamespace<SnapshotNotification> = {
  getInvalidFormatError(notif: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following Snapshot Notification is improperly formatted: ${JSON.stringify(notif)}`
    );
  },

  isValidMsgFormat(data: any): data is SnapshotNotification {
    return !!(
      data.id && typeof data.id === 'string'
      && data.title && typeof data.title === 'string'
      && data.body && typeof data.id === 'string'
      && data.choices && Array.isArray(data.choices)
      && data.space && typeof data.id === 'string'
      && data.event && typeof data.id === 'string'
      && data.start && typeof data.id === 'string'
      && data.expire && typeof data.id === 'string'
    );
  },

  checkMsgFormat(data: any): void {
    const valid = this.isValidMsgFormat(data);
    if (!valid) {
      console.log(`The following Snapshot Notification is improperly formatted: ${JSON.stringify(data)}`);
      throw this.getInvalidFormatError(data);
    }
  }
}

export namespace RmqSnapshotNotification {
  export type RmqMsgType = SnapshotNotification;
}
