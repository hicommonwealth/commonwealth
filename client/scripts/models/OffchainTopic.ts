import BN from 'bn.js';
class OffchainTopic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly telegram: string;
  public readonly communityId?: string;
  public readonly chainId?: string;
  public readonly token_threshold?: BN;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;

  constructor(name, id, description, telegram, communityId, chainId,
    featuredInSidebar, featuredInNewPost, token_threshold?) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    this.communityId = communityId;
    this.chainId = chainId;
    this.featuredInSidebar = featuredInSidebar;
    this.featuredInNewPost = featuredInNewPost;

    this.token_threshold = token_threshold;
  }
  public static fromJSON({ name, id, description, telegram, communityId, chainId,
    featuredInSidebar, featuredInNewPost, token_threshold }) {
    return new OffchainTopic(name, id, description, telegram, communityId, chainId, 
      featuredInSidebar, featuredInNewPost, token_threshold);
  }
}

export default OffchainTopic;
