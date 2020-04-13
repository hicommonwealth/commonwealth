class ChainEventType {
  public readonly id: string;
  public readonly chain: string;
  public readonly eventName: string;
  public readonly schema: any;

  constructor(id, chain, eventName, schema) {
    this.id = id;
    this.chain = chain;
    this.eventName = eventName;
    this.schema = schema;
  }

  public static fromJSON(json) {
    return new ChainEventType(json.id, json.chain, json.event_name, json.event_schema);
  }
}

export default ChainEventType;
