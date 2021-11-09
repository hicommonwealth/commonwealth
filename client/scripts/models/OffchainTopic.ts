import BN from 'bn.js';
class OffchainTopic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly telegram: string;
  public readonly communityId?: string;
  public readonly chainId?: string;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;
  public readonly defaultOffchainTemplate?: string;

  private _tokenThreshold?: BN;
  public get tokenThreshold() { return this._tokenThreshold; }
  public setTokenThreshold(t: BN) { this._tokenThreshold = t; }

  constructor(name, id, description, telegram, communityId, chainId,
    featuredInSidebar, featuredInNewPost, defaultOffchainTemplate, tokenThreshold?) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    this.communityId = communityId;
    this.chainId = chainId;
    this.featuredInSidebar = featuredInSidebar;
    this.featuredInNewPost = featuredInNewPost;
    this.defaultOffchainTemplate = defaultOffchainTemplate;
    this._tokenThreshold = tokenThreshold;
  }
  public static fromJSON({ name, id, description, telegram, communityId, chainId,
    featuredInSidebar, featuredInNewPost, defaultOffchainTemplate, tokenThreshold
  }) {
    return new OffchainTopic(name, id, description, telegram, communityId, chainId,
      featuredInSidebar, featuredInNewPost, defaultOffchainTemplate, tokenThreshold);
  }
}

export default OffchainTopic;
