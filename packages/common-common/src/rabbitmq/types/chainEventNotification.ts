import type { RmqMsgNamespace } from 'common-common/src/rabbitmq/types';
import { RmqMsgFormatError } from 'common-common/src/rabbitmq/types';
import type { ChainEventNotification } from 'commonwealth/shared/types';

/**
 * This object is merged with the namespace with the same name below so that within one object we have the invalid
 * format error, the function to check the format, and the type itself
 */
export const RmqCENotification: RmqMsgNamespace<ChainEventNotification> = {
  /**
   * This function constructs an instance of the RmqMsgFormatError using the RabbitMQ message. This is used jointly with
   * the isValidMsgFormat below. If the error returned by this function is thrown inside a messageProcessor function
   * then RabbitMQ will NOT re-queue the message to retry processing but will instead reroute the message to a
   * DeadLetterQueue for future maual processing.
   * @param notification The raw message from RabbitMQ
   */
  getInvalidFormatError(notification: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following notification is improperly formatted: ${JSON.stringify(
        notification
      )}`
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
  isValidMsgFormat(data: any): data is ChainEventNotification {
    return !!(
      data.id &&
      typeof data.id === 'string' &&
      data.notification_data &&
      typeof data.notification_data === 'string' &&
      data.chain_event_id &&
      typeof data.chain_event_id === 'string' &&
      data.category_id === 'chain-event' &&
      data.chain_name &&
      typeof data.chain_name === 'string' &&
      data.updated_at &&
      data.created_at &&
      typeof data.ChainEvent.chain_event_type_id === 'string' &&
      typeof data.ChainEvent.block_number === 'string'
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
        `The following notification is improperly formatted: ${JSON.stringify(
          data
        )}`
      );
      throw this.getInvalidFormatError(data);
    }
  },
};

// merged with the above object
export namespace RmqCENotification {
  export type RmqMsgType = ChainEventNotification;
}
