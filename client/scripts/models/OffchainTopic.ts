class OffchainTopic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly telegram: string;
  public readonly communityId?: string;
  public readonly chainId?: string;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;

  constructor(name, id, description, telegram, communityId, chainId, featuredInSidebar, featuredInNewPost) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    this.communityId = communityId;
    this.chainId = chainId;
    this.featuredInSidebar = featuredInSidebar;
    this.featuredInNewPost = featuredInNewPost;
  }
  public static fromJSON({ name, id, description, telegram, communityId, chainId, featuredInSidebar, featuredInNewPost }) {
    return new OffchainTopic(name, id, description, telegram, communityId, chainId, featuredInSidebar, featuredInNewPost);
  }
}

export default OffchainTopic;
