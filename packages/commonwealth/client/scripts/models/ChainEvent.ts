import _ from 'underscore';
import { IChainEventData } from 'chain-events/src';
import ChainEventType from './ChainEventType';

class ChainEvent {
  public readonly id?: number;
  public readonly blockNumber: number;
  public readonly data: IChainEventData;
  public readonly type: ChainEventType;

  public eq(e: ChainEvent) {
    return e.data.kind === this.data.kind && _.isEqual(this.data, e.data);
  }

  constructor(blockNumber, data, type, id?) {
    this.id = id;
    this.blockNumber = blockNumber;
    this.data = data;
    this.type = type;
  }

  public static fromJSON(json, chainEventType?: ChainEventType) {
    return new ChainEvent(
      json.blockNumber || json.block_number,
      json.data || json.event_data,
      chainEventType || ChainEventType.fromJSON(json.ChainEventType),
      json.id,
    );
  }
}

export default ChainEvent;
