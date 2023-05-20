import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import type { ChainEventAttributes } from 'chain-events/services/database/models/chain_event';
import type { RmqMsgNamespace } from './index';
import { RmqMsgFormatError } from './index';

interface IRmqMsgCreateCENotificationsCUD {
  ChainEvent: ChainEventAttributes;
  event: CWEvent;
  cud: 'create';
}

export const RmqCENotificationCUD: RmqMsgNamespace<IRmqMsgCreateCENotificationsCUD> =
  {
    getInvalidFormatError(notification: any) {
      return new RmqMsgFormatError(
        `The following notification is improperly formatted: ${JSON.stringify(
          notification
        )}`
      );
    },

    isValidMsgFormat(data: any): data is IRmqMsgCreateCENotificationsCUD {
      return !!(
        typeof data.ChainEvent?.id === 'number' &&
        typeof data.ChainEvent.block_number === 'number' &&
        data.ChainEvent.event_data &&
        Object.values(SupportedNetwork).includes(data.ChainEvent.network) &&
        data.ChainEvent.chain_name &&
        typeof data.ChainEvent.chain_name === 'string' &&
        typeof data.ChainEvent.entity_id === 'number' &&
        typeof data.event.blockNumber === 'number' &&
        data.event.data &&
        Object.values(SupportedNetwork).includes(data.event.network) &&
        data.cud === 'create'
      );
    },

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

export namespace RmqCENotificationCUD {
  export type RmqMsgType = IRmqMsgCreateCENotificationsCUD;
}
