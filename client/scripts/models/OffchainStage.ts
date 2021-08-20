class OffchainStage {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly communityId?: string;
  public readonly chainId?: string;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;

  constructor(name, id, description, communityId, chainId, featuredInSidebar, featuredInNewPost) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.communityId = communityId;
    this.chainId = chainId;
    this.featuredInSidebar = featuredInSidebar;
    this.featuredInNewPost = featuredInNewPost;
  }
  public static fromJSON({ name, id, description, communityId, chainId, featuredInSidebar, featuredInNewPost }) {
    return new OffchainStage(name, id, description, communityId, chainId, featuredInSidebar, featuredInNewPost);
  }
}

export default OffchainStage;
