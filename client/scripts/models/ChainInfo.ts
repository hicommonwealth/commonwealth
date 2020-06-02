import $ from 'jquery';
import app from 'state';
import { ChainNetwork } from './types';
import OffchainTag from './OffchainTag';

class ChainInfo {
  public readonly id: string;
  public readonly symbol: string;
  public name: string;
  public readonly network: ChainNetwork;
  public readonly iconUrl: string;
  public description: string;
  public readonly featuredTags: string[];
  public readonly tags: OffchainTag[];
  public readonly chainObjectId: string;

  constructor(id, network, symbol, name, iconUrl, description, featuredTags, tags, chainObjectVersion?) {
    this.id = id;
    this.network = network;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.featuredTags = featuredTags || [];
    this.tags = tags || [];
    this.chainObjectId = chainObjectVersion && chainObjectVersion.id;
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
      json.ChainObjectVersion
    );
  }

  public async updateChainData(name: string, description: string,) {
    const r = await $.post(`${app.serverUrl()}/updateChain`, {
      'id': app.activeChainId(),
      'name': name,
      'description': description,
      'jwt': app.login.jwt,
    });
    const updatedChain: ChainInfo = r.result;
    this.name = updatedChain.name;
    this.description = updatedChain.description;
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
