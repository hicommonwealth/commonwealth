import { ChainInfo, CommunityInfo } from ".";

class Webhook {
  public readonly id: number;
  public readonly url: string;
  public readonly categories: string[];
  public readonly chain_id?: string;
  public readonly offchain_community_id?: string;
  public readonly Chain?: ChainInfo;
  public readonly OffchainCommunity?: CommunityInfo;

  constructor(id, url, categories, chain_id, offchain_community_id, chain, offchainCommunity) {
    this.id = id;
    this.url = url;
    this.categories = categories;
    this.chain_id = chain_id;
    this.offchain_community_id = offchain_community_id;
    this.Chain = chain;
    this.OffchainCommunity = offchainCommunity
  }

  public label() {
    const hi = this.url.match(/.*([^\.]+)(com|net|org|info|coop|int|co\.uk|org\.uk|ac\.uk|uk|__and so on__)$/);
    console.log(hi);
  }

  public static fromJSON(json) {
    return new Webhook(
      json.id,
      json.url,
      json.categories,
      json.chain_id,
      json.offchain_community_id,
      json.Chain,
      json.OffchainCommunity,
    );
  }
}

export default Webhook;
