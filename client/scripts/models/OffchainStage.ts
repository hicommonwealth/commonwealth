class OffchainStage {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly communityId?: string;
  public readonly chainId?: string;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;
  public readonly defaultOffchainTemplate?: string;

  constructor(name, id, description, communityId, chainId, featuredInSidebar, featuredInNewPost, defaultOffchainTemplate) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.communityId = communityId;
    this.chainId = chainId;
    this.featuredInSidebar = featuredInSidebar;
    this.featuredInNewPost = featuredInNewPost;
    this.defaultOffchainTemplate = defaultOffchainTemplate;
  }
  public static fromJSON({ name, id, description, communityId, chainId, featuredInSidebar, featuredInNewPost, defaultOffchainTemplate }) {
    return new OffchainStage(name, id, description, communityId, chainId, featuredInSidebar, featuredInNewPost, defaultOffchainTemplate);
  }
}

export default OffchainStage;
