import BN from 'bn.js';

class Topic {
  public readonly name: string;
  public readonly id: number;
  public readonly description: string;
  public readonly telegram?: string;
  public readonly chainId: string;
  public readonly featuredInSidebar?: boolean;
  public readonly featuredInNewPost?: boolean;
  public order?: number;
  public readonly defaultOffchainTemplate?: string;
  public totalThreads?: number;

  private _tokenThreshold?: BN;
  public get tokenThreshold() {
    return this._tokenThreshold;
  }

  public setTokenThreshold(t: BN) {
    this._tokenThreshold = t;
  }

  constructor({
    name,
    id,
    description,
    telegram,
    chain_id,
    featured_in_sidebar,
    featured_in_new_post,
    order,
    default_offchain_template,
    token_threshold,
    total_threads,
  }: {
    name: string;
    id: number;
    description: string;
    telegram?: string;
    chain_id?: string;
    featured_in_sidebar?: boolean;
    featured_in_new_post?: boolean;
    order?: number;
    default_offchain_template?: string;
    token_threshold?: BN | string | number;
    total_threads: number;
  }) {
    this.name = name;
    this.id = id;
    this.description = description;
    this.telegram = telegram;
    this.chainId = chain_id;
    this.featuredInSidebar = featured_in_sidebar;
    this.featuredInNewPost = featured_in_new_post;
    this.order = order;
    this.defaultOffchainTemplate = default_offchain_template;
    if (token_threshold !== undefined) {
      this._tokenThreshold = new BN(token_threshold);
    }
    this.totalThreads = total_threads || 0;
  }
}

export default Topic;
