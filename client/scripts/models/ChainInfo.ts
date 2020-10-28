import $ from 'jquery';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import { ChainNetwork } from './types';
import OffchainTopic from './OffchainTopic';

class ChainInfo {
  public readonly id: string;
  public readonly symbol: string;
  public name: string;
  public readonly network: ChainNetwork;
  public readonly iconUrl: string;
  public description: string;
  public website: string;
  public chat: string;
  public telegram: string;
  public github: string;
  public readonly featuredTopics: string[];
  public readonly topics: OffchainTopic[];
  public readonly chainObjectId: string;
  public adminsAndMods: RoleInfo[];

  constructor(
    id, network, symbol, name, iconUrl, description, website, chat, telegram,
    github, featuredTopics, topics, adminsAndMods?
  ) {
    this.id = id;
    this.network = network;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.website = website;
    this.chat = chat;
    this.telegram = telegram;
    this.github = github;
    this.featuredTopics = featuredTopics || [];
    this.topics = topics || [];
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
      json.website,
      json.chat,
      json.telegram,
      json.github,
      json.featured_topics,
      json.topics,
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
        r.Address.chain,
        r.chain_id,
        r.offchain_community_id,
        r.permission,
        r.is_user_default
      ));
    });
  }

  public removeAdmin(role) {
    console.log(this.adminsAndMods);
    const idx_ = this.adminsAndMods.indexOf(role);
    console.log(idx_);
    const existingRole = this.adminsAndMods.filter((r) => {
      return r.id === role.id;
    })[0];
    const idx = this.adminsAndMods.indexOf(existingRole);
    console.log(idx);
    this.adminsAndMods.splice(idx, 1);
    console.log(this.adminsAndMods);
  }

  public addAdmin(r) {
    this.adminsAndMods.push(new RoleInfo(
      r.id,
      r.address_id,
      r.Address.address,
      r.Address.chain,
      r.chain_id,
      r.offchain_community_id,
      r.permission,
      r.is_user_default
    ));
  }

  public async updateChainData(
    name: string, description: string, website: string, chat: string, telegram: string, github: string
  ) {
    // TODO: Change to PUT /chain
    const r = await $.post(`${app.serverUrl()}/updateChain`, {
      'id': app.activeChainId(),
      'name': name,
      'description': description,
      'website': website,
      'chat': chat,
      'telegram': telegram,
      'github': github,
      'jwt': app.user.jwt,
    });
    const updatedChain: ChainInfo = r.result;
    this.name = updatedChain.name;
    this.description = updatedChain.description;
    this.website = updatedChain.website;
    this.chat = updatedChain.chat;
    this.telegram = telegram;
    this.github = github;
  }

  public addFeaturedTopic(topic: string) {
    this.featuredTopics.push(topic);
  }

  public removeFeaturedTopic(topic: string) {
    if (this.featuredTopics.includes(topic)) {
      this.featuredTopics.splice(this.featuredTopics.indexOf(topic), 1);
    }
  }

  public async updateFeaturedTopics(topics: string[]) {
    try {
      // TODO: Change to PUT /chain
      await $.post(`${app.serverUrl()}/updateChain`, {
        'id': app.activeChainId(),
        'featured_topics[]': topics,
        'jwt': app.user.jwt
      });
    } catch (err) {
      console.log('Failed to update featured topics');
      throw new Error((err.responseJSON && err.responseJSON.error)
        ? err.responseJSON.error
        : 'Failed to update featured topics');
    }
  }
}

export default ChainInfo;
