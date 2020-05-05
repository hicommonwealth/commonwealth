import { IChainEventData } from 'events/interfaces';
import ChainEventType from './ChainEventType';

class ChainEvent {
  public readonly id: number;
  public readonly blockNumber: number;
  public readonly data: IChainEventData;
  public readonly type: ChainEventType;

  constructor(id, blockNumber, data, type) {
    this.id = id;
    this.blockNumber = blockNumber;
    this.data = data;
    this.type = type;
  }

  public static fromJSON(json) {
    return new ChainEvent(
      json.id,
      json.block_number,
      json.event_data,
      ChainEventType.fromJSON(json.ChainEventType),
    );
  }
}

export default ChainEvent;
