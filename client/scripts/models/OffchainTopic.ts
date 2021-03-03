class OffchainTopic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly telegram: string;
  public readonly communityId?: string;
  public readonly chainId?: string;

  constructor(name, id, description, telegram, communityId, chainId) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    this.communityId = communityId;
    this.chainId = chainId;
  }
  public static fromJSON({ name, id, description, telegram, communityId, chainId }) {
    return new OffchainTopic(name, id, description, telegram, communityId, chainId);
  }
}

export default OffchainTopic;
