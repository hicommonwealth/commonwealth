import {CWEvent, SupportedNetwork} from "chain-events/src";
import {ChainEventAttributes} from "chain-events/services/database/models/chain_event";
import {IRmqMsgCreateEntityCUD} from "./chainEntityCUD";


export type TRmqMsgCENotificationsCUD = IRmqMsgCreateCENotificationsCUD;

export interface IRmqMsgCreateCENotificationsCUD {
  ChainEvent: ChainEventAttributes
  event: CWEvent
  cud: 'create'
}

export function isRmqMsgCreateCENotificationsCUD(data: any): data is IRmqMsgCreateEntityCUD {
  return (
    typeof data.ChainEvent?.id === 'string'
    && data.ChainEvent.chain_event_type_id && typeof data.ChainEvent.chain_event_type_id === 'string'
    && typeof data.ChainEvent.block_number === 'number'
    && data.ChainEvent.event_data
    && typeof data.event.blockNumber === 'number'
    && data.event.data // type would be computationally expensive to check
    && Object.values(SupportedNetwork).includes(data.event.network)
    && data.cud === 'create'
  );
}
