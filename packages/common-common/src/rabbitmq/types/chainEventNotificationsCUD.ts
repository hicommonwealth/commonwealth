import {CWEvent, SupportedNetwork} from "chain-events/src";
import {ChainEventAttributes} from "chain-events/services/database/models/chain_event";
import {IRmqMsgCreateEntityCUD} from "./chainEntityCUD";


export type TRmqMsgCENotificationsCUD = IRmqMsgCreateCENotificationsCUD;

export function isTRmqMsgCENotificationsCUD(data: any): data is TRmqMsgCENotificationsCUD {
  return isRmqMsgCreateCENotificationsCUD(data);
}

export interface IRmqMsgCreateCENotificationsCUD {
  ChainEvent: ChainEventAttributes
  event: CWEvent
  cud: 'create'
}

export function isRmqMsgCreateCENotificationsCUD(data: any): data is IRmqMsgCreateEntityCUD {
  // TODO: optimize notifications to reduce message size/data duplication
  return (
    typeof data.ChainEvent?.id === 'number'
    && data.ChainEvent.chain_event_type_id && typeof data.ChainEvent.chain_event_type_id === 'string'
    && typeof data.ChainEvent.block_number === 'number'
    && data.ChainEvent.event_data
    && typeof data.event.blockNumber === 'number'
    && data.event.data
    && Object.values(SupportedNetwork).includes(data.event.network)
    && data.cud === 'create'
    && data.ChainEvent.ChainEventType
    && data.ChainEvent.ChainEventType.id
    && data.ChainEvent.ChainEventType.chain
    && data.ChainEvent.ChainEventType.event_network
    && data.ChainEvent.ChainEventType.event_name
  );
}
