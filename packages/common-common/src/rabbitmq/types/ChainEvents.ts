import {CWEvent} from "chain-events/src";
import {RmqMsgFormatError, RmqMsgNamespace} from "common-common/src/rabbitmq";

/**
 * This class is merged with the namespace with the same name below so that within one object we have the invalid
 * format error, the function to check the format, and the type itself
 */
export const RmqCWEvent: RmqMsgNamespace<CWEvent> = {
  getInvalidFormatError(event: any): RmqMsgFormatError {
    return new RmqMsgFormatError(`The following CW event is improperly formatted: ${JSON.stringify(event)}`);
  },

  isValidMsgFormat(data: any): data is CWEvent {
    return (
      typeof data.blockNumber === 'number'
      && data.data
      && data.network && typeof data.network === 'string'
    );
  }
}

// merged with class above
export namespace RmqCWEvent {
  export type RmqMsgType = CWEvent;
}
