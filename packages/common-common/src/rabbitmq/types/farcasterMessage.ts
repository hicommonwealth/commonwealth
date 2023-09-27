import type { IFarcasterMessage } from '../../types';
import type { RmqMsgNamespace } from 'common-common/src/rabbitmq/types';
import { RmqMsgFormatError } from 'common-common/src/rabbitmq/types';

export const rmqFarcasterMessage: RmqMsgNamespace<IFarcasterMessage> = {
  getInvalidFormatError(event: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following snapshot event is improperly formatted: ${JSON.stringify(
        event
      )}`
    );
  },

  isValidMsgFormat(data: any): data is IFarcasterMessage {
    return typeof data.lastURIProcessed === 'string';
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
export namespace RmqFarcasterMessage {
  export type RmqMsgType = IFarcasterMessage;
}
