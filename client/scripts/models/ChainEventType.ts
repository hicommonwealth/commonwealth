import { SubstrateEventKind } from 'events/edgeware/types';

class ChainEventType {
  public readonly id: string;
  public readonly chain: string;
  public readonly eventName: SubstrateEventKind;

  constructor(id, chain, eventName) {
    this.id = id;
    this.chain = chain;
    this.eventName = eventName;
  }

  public static fromJSON(json) {
    return new ChainEventType(json.id, json.chain, json.event_name);
  }
}

export default ChainEventType;
