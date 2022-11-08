import {RmqMsgFormatError, RmqMsgNamespace} from "common-common/src/rabbitmq";
import {ChainEventNotification} from "commonwealth/shared/types";
import moment from "moment/moment";

export const RmqCENotification: RmqMsgNamespace<ChainEventNotification> = {
  getInvalidFormatError(notification: any): RmqMsgFormatError {
    return new RmqMsgFormatError(
      `The following notification is improperly formatted: ${JSON.stringify(notification)}`
    );
  },

  isValidMsgFormat(data: any): data is ChainEventNotification {
    return (
      data.id && typeof data.id === 'string'
      && data.notification_data && typeof data.notification_data === 'string'
      && data.chain_event_id && typeof data.chain_event_id === 'string'
      && data.category_id === 'chain-event'
      && data.chain_id && typeof data.chain_id === 'string'
      && moment.isMoment(data.updated_at)
      && moment.isMoment(data.created_at)
      && data.ChainEvent
      && typeof data.ChainEvent.chain_event_type_id === 'string'
      && typeof data.ChainEvent.block_number === 'string'
    );
  }
}

export namespace RmqCENotification {
  export type RmqMsgType = ChainEventNotification;
}
