import type { ISnapshotNotification } from '../../types';
import type { RmqMsgNamespace } from 'common-common/src/rabbitmq';
import { RmqMsgFormatError } from 'common-common/src/rabbitmq';

export const RmqSnapshotEvent: RmqMsgNamespace<ISnapshotNotification> = {
  getInvalidFormatError(event: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following snapshot event is improperly formatted: ${JSON.stringify(
        event
      )}`
    );
  },

  isValidMsgFormat(data: any): data is ISnapshotNotification {
    return (
      typeof data.id === 'string' &&
      typeof data.event === 'string' &&
      typeof data.space === 'string' &&
      typeof data.expire === 'number'
    );
  },

  /**
   * This function combines the isValidMsgFormat and getInvalidFormatError functions. Essentially this function will
   * check the given data format and throw the RmqMsgFormatError if the format is invalid.
   * @param data The raw message from RabbitMQ
   */
  checkMsgFormat(data: any): void {
    const valid = this.isValidMsgFormat(data);
    if (!valid) throw this.getInvalidFormatError(data);
  },
};

// merged with class above
export namespace RmqSnapshotEvent {
  export type RmqMsgType = ISnapshotNotification;
}
