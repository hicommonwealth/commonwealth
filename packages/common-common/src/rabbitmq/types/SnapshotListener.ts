import { SnapshotEvent } from '../../../../snapshot-listener/src/types';
import { RmqMsgFormatError, RmqMsgNamespace } from "common-common/src/rabbitmq";

export const RmqSnapshotEvent: RmqMsgNamespace<SnapshotEvent> = {
  getInvalidFormatError(event: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following snapshot event is improperly formatted: ${JSON.stringify(event)}`
    );
  },

  isValidMsgFormat(data: any): data is SnapshotEvent {
    return (
      typeof data.id === 'string'
      && data.event === 'string'
      && data.space === 'string'
      && typeof data.expire === 'number'
    );
  }
}

// merged with class above
export namespace RmqSnapshotEvent {
  export type RmqMsgType = SnapshotEvent;
}


