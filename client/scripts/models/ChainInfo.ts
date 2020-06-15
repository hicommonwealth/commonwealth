import $ from 'jquery';
import app from 'state';
import { ChainNetwork } from './types';
import OffchainTag from './OffchainTag';

class ChainInfo {
  public readonly id: string;
  public readonly symbol: string;
  public readonly name: string;
  public readonly network: ChainNetwork;
  public readonly iconUrl: string;
  public readonly description: string;
  public readonly featuredTags: string[];
  public readonly tags: OffchainTag[];

  constructor(id, network, symbol, name, iconUrl, description, featuredTags, tags) {
    this.id = id;
    this.network = network;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.featuredTags = featuredTags || [];
    this.tags = tags || [];
  }

  public static fromJSON(json) {
    return new ChainInfo(
      json.id,
      json.network,
      json.symbol,
      json.name,
      json.icon_url,
      json.description,
      json.featured_tags,
      json.tags,
    );
  }

  public async updateFeaturedTags(tags: string[]) {
    try {
      await $.post(`${app.serverUrl()}/updateChain`, {
        'id': app.activeChainId(),
        'featured_tags[]': tags,
        'jwt': app.login.jwt
      });
    } catch (err) {
      console.log('Failed to update featured tags');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to update featured tags');
    }
  }
}

export default ChainInfo;
