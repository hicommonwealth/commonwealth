import { IChainEventKind, SupportedNetwork } from 'chain-events/src';

class ChainEventType {
  public readonly id: string;
  public readonly chain: string;
  public readonly eventNetwork: SupportedNetwork;
  public readonly eventName: IChainEventKind;

  constructor(id, chain, eventNetwork, eventName) {
    this.id = id;
    this.chain = chain;
    this.eventNetwork = eventNetwork;
    this.eventName = eventName;
  }

  public static fromJSON(json) {
    return new ChainEventType(json.id, json.chain, json.event_network, json.event_name);
  }
}

export default ChainEventType;
