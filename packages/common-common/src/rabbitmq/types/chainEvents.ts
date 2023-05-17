import type { CWEvent } from 'chain-events/src';
import type { RmqMsgNamespace } from 'common-common/src/rabbitmq/types';
import { RmqMsgFormatError } from 'common-common/src/rabbitmq/types';

/**
 * This class is merged with the namespace with the same name below so that within one object we have the invalid
 * format error, the function to check the format, and the type itself
 */

export const RmqCWEvent: RmqMsgNamespace<CWEvent> = {
  /**
   * This function constructs an instance of the RmqMsgFormatError using the RabbitMQ message. This is used jointly with
   * the isValidMsgFormat below. If the error returned by this function is thrown inside a messageProcessor function
   * then RabbitMQ will NOT re-queue the message to retry processing but will instead reroute the message to a
   * DeadLetterQueue for future maual processing.
   * @param event The raw message from RabbitMQ
   */
  getInvalidFormatError(event: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following CW event is improperly formatted: ${JSON.stringify(event)}`
    );
  },

  /**
   * This function is used in a messageProcessor function to ensure that the message it receives from a RabbitMQ queue
   * contains the correct data in the correct format. Generally, if this function returns false the messageProcessor
   * function should throw the error returned from the getInvalidFormatError function above. This indicates to the
   * RabbitMQController that the message should be rerouted to the DeadLetterQueue and left for future manual
   * processing.
   * @param data The raw message from RabbitMQ
   */
  isValidMsgFormat(data: any): data is CWEvent {
    return !!(
      typeof data.blockNumber === 'number' &&
      data.data &&
      data.network &&
      typeof data.network === 'string'
    );
  },

  /**
   * This function combines the isValidMsgFormat and getInvalidFormatError functions. Essentially this function will
   * check the given data format and throw the RmqMsgFormatError if the format is invalid.
   * @param data The raw message from RabbitMQ
   */
  checkMsgFormat(data: any): void {
    const valid = this.isValidMsgFormat(data);
    if (!valid) {
      console.log(
        `The following CW event is improperly formatted: ${JSON.stringify(
          data
        )}`
      );
      throw this.getInvalidFormatError(data);
    }
  },
};

// merged with class above
export namespace RmqCWEvent {
  export type RmqMsgType = CWEvent;
}
