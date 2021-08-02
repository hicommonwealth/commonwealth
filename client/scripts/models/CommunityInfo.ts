import $ from 'jquery';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import ChainInfo from './ChainInfo';
import OffchainTopic from './OffchainTopic';

interface CommunityData {
  name: string,
  iconUrl: string,
  description: string,
  website: string,
  discord: string,
  element: string,
  telegram: string;
  github: string;
  visible: boolean;
  stagesEnabled: boolean,
  additionalStages: string,
  customDomain: string;
  terms: string;
  invitesEnabled: boolean,
  privacyEnabled: boolean,
}

class CommunityInfo {
  public readonly id: string;
  public iconUrl: string;
  public name: string;
  public description: string;
  public website: string;
  public discord: string;
  public element: string;
  public telegram: string;
  public github: string;
  public readonly defaultChain: ChainInfo;
  public readonly visible: boolean;
  public invitesEnabled: boolean;
  public privacyEnabled: boolean;
  public stagesEnabled: boolean;
  public additionalStages: string;
  public customDomain: string;
  public terms: string;
  public readonly collapsedOnHomepage: boolean;
  public readonly featuredTopics: string[];
  public readonly topics: OffchainTopic[];
  public adminsAndMods: RoleInfo[];
  public members: RoleInfo[];

  // TODO: convert this to accept opject with params instead
  constructor({
    id, name, description, iconUrl, website, discord, element, telegram, github, defaultChain, visible,
    stagesEnabled, additionalStages,
    customDomain, terms, invitesEnabled, privacyEnabled, collapsedOnHomepage, featuredTopics, topics, adminsAndMods
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.iconUrl = iconUrl;
    this.website = website;
    this.discord = discord;
    this.element = element;
    this.telegram = telegram;
    this.github = github;
    this.defaultChain = defaultChain;
    this.visible = visible;
    this.stagesEnabled = stagesEnabled;
    this.additionalStages = additionalStages;
    this.customDomain = customDomain;
    this.terms = terms;
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
    this.collapsedOnHomepage = collapsedOnHomepage;
    this.featuredTopics = featuredTopics || [];
    this.topics = topics || [];
    this.adminsAndMods = adminsAndMods || [];
  }

  public static fromJSON({
    id,
    name,
    description,
    iconUrl,
    website,
    discord,
    element,
    telegram,
    github,
    defaultChain: default_chain,
    visible,
    stagesEnabled,
    additionalStages,
    customDomain,
    terms,
    invitesEnabled,
    privacyEnabled,
    collapsedOnHomepage: collapsed_on_homepage,
    featuredTopics,
    topics,
    adminsAndMods,
  }) {
    return new CommunityInfo({
      id,
      name,
      description,
      iconUrl,
      website,
      discord,
      element,
      telegram,
      github,
      defaultChain: default_chain,
      visible,
      stagesEnabled,
      additionalStages,
      customDomain,
      terms,
      invitesEnabled,
      privacyEnabled,
      collapsedOnHomepage: collapsed_on_homepage,
      featuredTopics,
      topics,
      adminsAndMods,
    });
  }

  // TODO: get operation should not have side effects, and either way this shouldn't be here
  public async getMembers(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, { community: id, });
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

  public async updateCommunityData({
    description,
    invitesEnabled,
    name,
    iconUrl,
    privacyEnabled,
    stagesEnabled,
    additionalStages,
    customDomain,
    terms,
    website,
    discord,
    element,
    telegram,
    github,
  }) {
    // TODO: Change to PUT /community
    const r = await $.post(`${app.serverUrl()}/updateCommunity`, {
      'id': app.activeCommunityId(),
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
      'website': website,
      'discord': discord,
      'element': element,
      'telegram': telegram,
      'github': github,
      'stagesEnabled': stagesEnabled,
      'additionalStages': additionalStages,
      'customDomain': customDomain,
      'terms': terms,
      'privacy': privacyEnabled,
      'invites': invitesEnabled,
      'jwt': app.user.jwt,
    });
    const updatedCommunity: CommunityInfo = r.result;
    this.name = updatedCommunity.name;
    this.description = updatedCommunity.description;
    this.iconUrl = updatedCommunity.iconUrl;
    this.website = updatedCommunity.website;
    this.discord = updatedCommunity.discord;
    this.element = updatedCommunity.element;
    this.telegram = updatedCommunity.telegram;
    this.github = updatedCommunity.github;
    this.stagesEnabled = stagesEnabled;
    this.additionalStages = additionalStages;
    this.customDomain = updatedCommunity.customDomain;
    this.terms = updatedCommunity.terms;
    this.privacyEnabled = updatedCommunity.privacyEnabled;
    this.invitesEnabled = updatedCommunity.invitesEnabled;
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
      // TODO: Change to PUT /community
      await $.post(`${app.serverUrl()}/updateCommunity`, {
        'id': app.activeCommunityId(),
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

export default CommunityInfo;
