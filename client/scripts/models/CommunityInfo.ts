import $ from 'jquery';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import ChainInfo from './ChainInfo';
import OffchainTopic from './OffchainTopic';
import { OffchainCommunityInstance } from 'server/models/offchain_community';

interface CommunityData {
  name: string;
  iconUrl: string;
  description: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  visible: boolean;
  defaultChain: string;
  stagesEnabled: boolean;
  customStages: string;
  customDomain: string;
  terms: string;
  invitesEnabled: boolean;
  privacyEnabled: boolean;
  collapsedOnHomepage: boolean;
  defaultSummaryView: boolean;
  featuredTopics: any[];
  topics: any[];
  adminsAndMods: any;
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
  public customStages: string;
  public customDomain: string;
  public terms: string;
  public readonly collapsedOnHomepage: boolean;
  public defaultSummaryView: boolean;
  public readonly featuredTopics: string[];
  public readonly topics: OffchainTopic[];
  public adminsAndMods: RoleInfo[];
  public members: RoleInfo[];

  // TODO: convert this to accept opject with params instead
  constructor({
    id,
    name,
    description,
    iconUrl,
    website,
    discord,
    element,
    telegram,
    github,
    defaultChain,
    visible,
    stagesEnabled,
    customStages,
    customDomain,
    terms,
    invitesEnabled,
    privacyEnabled,
    collapsedOnHomepage,
    defaultSummaryView,
    featuredTopics,
    topics,
    adminsAndMods,
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
    this.customStages = customStages;
    this.customDomain = customDomain;
    this.terms = terms;
    this.invitesEnabled = invitesEnabled;
    this.privacyEnabled = privacyEnabled;
    this.collapsedOnHomepage = collapsedOnHomepage;
    this.defaultSummaryView = defaultSummaryView;
    this.featuredTopics = featuredTopics || [];
    this.topics = topics || [];
    this.adminsAndMods = adminsAndMods || [];
  }

  public static fromJSON({
    id,
    name,
    description,
    icon_url,
    website,
    discord,
    element,
    telegram,
    github,
    default_chain,
    visible,
    stages_enabled,
    custom_stages,
    custom_domain,
    terms,
    invites_enabled,
    privacy_enabled,
    collapsed_on_homepage,
    default_summary_view,
    featured_topics,
    topics,
    admins_and_mods,
  }) {
    return new CommunityInfo({
      id,
      name,
      description,
      iconUrl: icon_url,
      website,
      discord,
      element,
      telegram,
      github,
      defaultChain: default_chain,
      visible,
      stagesEnabled: stages_enabled,
      customStages: custom_stages,
      customDomain: custom_domain,
      terms,
      invitesEnabled: invites_enabled,
      privacyEnabled: privacy_enabled,
      collapsedOnHomepage: collapsed_on_homepage,
      defaultSummaryView: default_summary_view,
      featuredTopics: featured_topics,
      topics,
      adminsAndMods: admins_and_mods,
    });
  }

  // TODO: get operation should not have side effects, and either way this shouldn't be here
  public async getMembers(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, {
        community: id,
      });
      this.setMembers(res.result);
      const roles = res.result.filter((r) => {
        return (
          r.permission === RolePermission.admin ||
          r.permission === RolePermission.moderator
        );
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
      this.members.push(
        new RoleInfo(
          r.id,
          r.address_id,
          r.Address.address,
          r.Address.chain,
          r.chain_id,
          r.offchain_community_id,
          r.permission,
          r.is_user_default
        )
      );
    });
  }

  public setAdmins(roles) {
    this.adminsAndMods = [];
    roles.forEach((r) => {
      this.adminsAndMods.push(
        new RoleInfo(
          r.id,
          r.address_id,
          r.Address.address,
          r.Address.chain,
          r.chain_id,
          r.offchain_community_id,
          r.permission,
          r.is_user_default
        )
      );
    });
  }

  public async updateCommunityData({
    description,
    invitesEnabled,
    name,
    iconUrl,
    privacyEnabled,
    defaultSummaryView,
    stagesEnabled,
    customStages,
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
      id: app.activeCommunityId(),
      name,
      description,
      icon_url: iconUrl,
      website,
      discord,
      element,
      telegram,
      github,
      stages_enabled: stagesEnabled,
      custom_stages: customStages,
      custom_domain: customDomain,
      terms,
      privacy: privacyEnabled,
      invites: invitesEnabled,
      default_summary_view: defaultSummaryView,
      jwt: app.user.jwt,
    });
    const updatedCommunity: OffchainCommunityInstance = r.result;
    this.name = updatedCommunity.name;
    this.description = updatedCommunity.description;
    this.iconUrl = updatedCommunity.icon_url;
    this.website = updatedCommunity.website;
    this.discord = updatedCommunity.discord;
    this.element = updatedCommunity.element;
    this.telegram = updatedCommunity.telegram;
    this.github = updatedCommunity.github;
    this.stagesEnabled = stagesEnabled;
    this.customStages = customStages;
    this.customDomain = updatedCommunity.custom_domain;
    this.terms = updatedCommunity.terms;
    this.privacyEnabled = updatedCommunity.privacy_enabled;
    this.invitesEnabled = updatedCommunity.invites_enabled;
    this.defaultSummaryView = updatedCommunity.default_summary_view;
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
        id: app.activeCommunityId(),
        'featured_topics[]': topics,
        jwt: app.user.jwt,
      });
    } catch (err) {
      console.log('Failed to update featured topics');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : 'Failed to update featured topics'
      );
    }
  }
}

export default CommunityInfo;
