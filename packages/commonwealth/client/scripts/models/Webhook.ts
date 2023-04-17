import type ChainInfo from './ChainInfo';

class Webhook {
  public readonly id: number;
  public readonly url: string;
  public categories: string[];
  public readonly chain_id?: string;
  public readonly Chain?: ChainInfo;

  constructor(id, url, categories, chain_id, chain) {
    this.id = id;
    this.url = url;
    this.categories = categories;
    this.chain_id = chain_id;
    this.Chain = chain;
  }

  public static fromJSON(json) {
    return new Webhook(
      json.id,
      json.url,
      json.categories,
      json.chain_id,
      json.Chain
    );
  }
}

export default Webhook;
