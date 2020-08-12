class OffchainTopic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly communityId?: string;
  public readonly chainId?: string;

  constructor(name, id, description, communityId, chainId) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.communityId = communityId;
    this.chainId = chainId;
  }
  public static fromJSON(json) {
    return new OffchainTopic(json.name, json.id, json.description, json.communityId, json.chainId);
  }
}

export default OffchainTopic;
