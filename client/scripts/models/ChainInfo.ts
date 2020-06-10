import $ from 'jquery';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
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
  public adminsAndMods: RoleInfo[];

  constructor(id, network, symbol, name, iconUrl, description, featuredTags, tags, chainObjectVersion?, adminsAndMods?) {
    this.id = id;
    this.network = network;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.featuredTags = featuredTags || [];
    this.tags = tags || [];
    this.chainObjectId = chainObjectVersion && chainObjectVersion.id;
    this.adminsAndMods = adminsAndMods || [];
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
      json.ChainObjectVersion,
      json.adminsAndMods,
    );
  }

  public async getAdminsAndMods(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, { chain: id, });
      const roles = res.result.filter((r) => {
        return r.permission === RolePermission.admin || r.permission === RolePermission.moderator;
      });
      this.setAdmins(roles);
    } catch {
      console.log('Failed to fetch admins/mods');
    }
  }

  public setAdmins(roles) {
    this.adminsAndMods = [];
    roles.forEach((r) => {
      this.adminsAndMods.push(new RoleInfo(
        r.id,
        r.address_id,
        r.Address.address,
        r.chain_id,
        r.offchain_community_id,
        r.permission,
        r.is_user_default
      ));
    });
  }

  public async updateChainData(name: string, description: string,) {
    // TODO: Change to PUT /chain
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

  public addFeaturedTag(tag: string) {
    this.featuredTags.push(tag);
  }

  public removeFeaturedTag(tag: string) {
    if (this.featuredTags.includes(tag)) {
      this.featuredTags.splice(this.featuredTags.indexOf(tag), 1);
    }
  }

  public async updateFeaturedTags(tags: string[]) {
    try {
      // TODO: Change to PUT /chain
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
