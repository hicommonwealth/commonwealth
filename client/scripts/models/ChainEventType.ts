class ChainEventType {
  public readonly id: string;
  public readonly chain: string;
  public readonly eventName: string;
  public readonly rawName: string;
  public readonly documentation: string;
  public readonly typedefs: string[];

  constructor(id, chain, eventName, rawName, documentation, typedefs) {
    this.id = id;
    this.chain = chain;
    this.eventName = eventName;
    this.rawName = rawName;
    this.documentation = documentation;
    this.typedefs = typedefs;
  }

  public static fromJSON(json) {
    return new ChainEventType(json.id, json.chain, json.event_name, json.raw_name, json.documentation, json.typedefs);
  }
}

export default ChainEventType;
