class OffchainTag {
  public readonly name: string;
  public readonly id: number;
  public readonly communityId?: string;
  public readonly chainId?: string;

  constructor(name, id, communityId, chainId) {
    this.name = name;
    this.id = id;
    this.communityId = communityId;
    this.chainId = chainId;
  }
  public static fromJSON(json) {
    return new OffchainTag(json.name, json.id, json.communityId, json.chainId);
  }
}

export default OffchainTag;
