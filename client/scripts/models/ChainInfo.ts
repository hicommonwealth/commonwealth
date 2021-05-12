import $ from 'jquery';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import { ChainNetwork, ChainBase } from './types';
import OffchainTopic from './OffchainTopic';

class ChainInfo {
  public readonly id: string;
  public readonly symbol: string;
  public name: string;
  public readonly network: ChainNetwork;
  public readonly base: ChainBase;
  public readonly iconUrl: string;
  public description: string;
  public website: string;
  public discord: string;
  public element: string;
  public telegram: string;
  public github: string;
  public customDomain: string;
  public readonly blockExplorerIds: { [id: string]: string };
  public readonly collapsedOnHomepage: boolean;
  public readonly featuredTopics: string[];
  public readonly topics: OffchainTopic[];
  public readonly chainObjectId: string;
  public adminsAndMods: RoleInfo[];
  public members: RoleInfo[];
  public type: string;

  // TODO: convert this to accept an object with params instead
  constructor(obj: {
      id: string,
      network: ChainNetwork,
      symbol: string,
      name: string,
      icon_url: string,
      description: string,
      website: string,
      discord: string,
      element: string,
      telegram: string,
      github: string,
      customDomain: string,
      blockExplorerIds: { [id: string]: string },
      collapsed_on_homepage: boolean,
      featured_topics: string[],
      topics: OffchainTopic[],
      adminsAndMods?: RoleInfo[],
      base?: ChainBase,
      type?: string,
    }) {
    const {
      id, network, base, symbol, name, icon_url, description, website, discord, element, telegram, github,
      customDomain, blockExplorerIds, collapsed_on_homepage, featured_topics, topics, adminsAndMods, type,
    } = obj;
    this.id = id;
    this.network = network;
    this.base = base;
    this.symbol = symbol;
    this.name = name;
    this.iconUrl = icon_url;
    this.description = description;
    this.website = website;
    this.discord = discord;
    this.element = element;
    this.telegram = telegram;
    this.github = github;
    this.customDomain = customDomain;
    this.blockExplorerIds = blockExplorerIds;
    this.collapsedOnHomepage = collapsed_on_homepage;
    this.featuredTopics = featured_topics || [];
    this.topics = topics || [];
    this.adminsAndMods = adminsAndMods || [];
    this.type = type;
  }

  public static fromJSON(json) {
    let blockExplorerIds;
    try {
      blockExplorerIds = JSON.parse(json.blockExplorerIds);
    } catch (e) {
      // ignore invalid JSON blobs
      blockExplorerIds = {};
    }
    if (json.blockExplorerIds !== undefined) delete json.blockExplorerIds;
    return new ChainInfo({ blockExplorerIds, ...json });
  }

  // TODO: get operation should not have side effects, and either way this shouldn't be here
  public async getMembers(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, { chain: id, });
      this.setMembers(res.result);
      const roles = res.result.filter((r) => {
        return r.permission === RolePermission.admin || r.permission === RolePermission.moderator;
      });
      this.setAdmins(roles);
      return this.adminsAndMods;
    } catch {
      console.log('Failed to fetch admins/mods');
    }
  }

  public setMembers(roles) {
    this.members = [];
    roles.forEach((r) => {
      this.members.push(new RoleInfo(
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

  // TODO: change to accept an object
  public async updateChainData(
    name: string, description: string, website: string, discord: string, element: string, telegram: string,
    github: string, customDomain: string
  ) {
    // TODO: Change to PUT /chain
    const r = await $.post(`${app.serverUrl()}/updateChain`, {
      'id': app.activeChainId(),
      'name': name,
      'description': description,
      'website': website,
      'discord': discord,
      'element': element,
      'telegram': telegram,
      'github': github,
      'customDomain': customDomain,
      'jwt': app.user.jwt,
    });
    const updatedChain: ChainInfo = r.result;
    this.name = updatedChain.name;
    this.description = updatedChain.description;
    this.website = updatedChain.website;
    this.discord = updatedChain.discord;
    this.element = updatedChain.element;
    this.telegram = updatedChain.telegram;
    this.github = updatedChain.github;
    this.customDomain = updatedChain.customDomain;
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
