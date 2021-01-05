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
  chat: string,
  telegram: string,
  github: string,
  visible: boolean;
  invitesEnabled: boolean,
  privacyEnabled: boolean,
}

class CommunityInfo {
  public readonly id: string;
  public iconUrl: string;
  public name: string;
  public description: string;
  public chat: string;
  public website: string;
  public telegram: string;
  public github: string;
  public introTitle: string;
  public introText: string;
  public readonly defaultChain: ChainInfo;
  public readonly visible: boolean;
  public invitesEnabled: boolean;
  public privacyEnabled: boolean;
  public readonly collapsedOnHomepage: boolean;
  public readonly featuredTopics: string[];
  public readonly topics: OffchainTopic[];
  public adminsAndMods: RoleInfo[];

  constructor(
    id, name, description, iconUrl, website, chat, telegram, github, introTitle, introText, defaultChain,
    visible, invitesEnabled, privacyEnabled, collapsedOnHomepage, featuredTopics, topics, adminsAndMods?
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.iconUrl = iconUrl;
    this.website = website;
    this.chat = chat;
    this.telegram = telegram;
    this.github = github;
    this.introTitle = introTitle;
    this.introText = introText;
    this.defaultChain = defaultChain;
    this.visible = visible;
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
    this.collapsedOnHomepage = collapsedOnHomepage;
    this.featuredTopics = featuredTopics || [];
    this.topics = topics || [];
    this.adminsAndMods = adminsAndMods || [];
  }

  public static fromJSON(json) {
    return new CommunityInfo(
      json.id,
      json.name,
      json.description,
      json.iconUrl,
      json.website,
      json.chat,
      json.telegram,
      json.github,
      json.introTitle,
      json.introText,
      json.default_chain,
      json.visible,
      json.invitesEnabled,
      json.privacyEnabled,
      json.collapsed_on_homepage,
      json.featuredTopics,
      json.topics,
      json.adminsAndMods,
    );
  }

  public async getAdminsAndMods(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, { community: id, });
      const roles = res.result.filter((r) => {
        return r.permission === RolePermission.admin || r.permission === RolePermission.moderator;
      });
      this.setAdmins(roles);
      return this.adminsAndMods;
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

  public async updateCommunityData({
    description,
    invitesEnabled,
    name,
    iconUrl,
    privacyEnabled,
    website,
    chat,
    telegram,
    github,
    introTitle,
    introText,
  }) {
    // TODO: Change to PUT /community
    const r = await $.post(`${app.serverUrl()}/updateCommunity`, {
      'id': app.activeCommunityId(),
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
      'website': website,
      'chat': chat,
      'telegram': telegram,
      'github': github,
      'introTitle': introTitle,
      'introText': introText,
      'privacy': privacyEnabled,
      'invites': invitesEnabled,
      'jwt': app.user.jwt,
    });
    const updatedCommunity: CommunityInfo = r.result;
    this.name = updatedCommunity.name;
    this.description = updatedCommunity.description;
    this.iconUrl = updatedCommunity.iconUrl;
    this.website = updatedCommunity.website;
    this.chat = updatedCommunity.chat;
    this.telegram = updatedCommunity.telegram;
    this.github = updatedCommunity.github;
    this.introTitle = introTitle;
    this.introText = introText;
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
