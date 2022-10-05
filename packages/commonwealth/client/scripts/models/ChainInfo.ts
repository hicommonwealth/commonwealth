import m from 'mithril';
import $ from 'jquery';
import { RegisteredTypes } from '@polkadot/types/types';
import app from 'state';
import { RoleInfo, RolePermission } from 'models';
import { ChainNetwork, ChainBase } from 'common-common/src/types';
import NodeInfo from './NodeInfo';

import {
  CWAvatar,
  CWJdenticon,
} from '../views/components/component_kit/cw_avatar';

class ChainInfo {
  public readonly id: string;
  public readonly ChainNode: NodeInfo;
  public readonly address: string;
  public readonly tokenName: string;
  public readonly default_symbol: string;
  public name: string;
  public readonly network: ChainNetwork;
  public readonly base: ChainBase;
  public iconUrl: string;
  public description: string;
  public website: string;
  public discord: string;
  public element: string;
  public telegram: string;
  public github: string;
  public stagesEnabled: boolean;
  public customStages: string;
  public customDomain: string;
  public snapshot: string[];
  public terms: string;
  public readonly blockExplorerIds: { [id: string]: string };
  public readonly collapsedOnHomepage: boolean;
  public defaultSummaryView: boolean;
  public readonly chainObjectId: string;
  public adminsAndMods: RoleInfo[];
  public members: RoleInfo[];
  public type: string;
  public chatEnabled: boolean;
  public readonly ss58Prefix: string;
  public readonly bech32Prefix: string;
  public decimals: number;
  public substrateSpec: RegisteredTypes;
  public hideProjects: boolean;
  public adminOnlyPolling: boolean;
  public communityBanner?: string;

  public get node() {
    return this.ChainNode;
  }

  constructor({
    id,
    network,
    default_symbol,
    name,
    iconUrl,
    description,
    website,
    discord,
    element,
    telegram,
    github,
    stagesEnabled,
    customStages,
    customDomain,
    snapshot,
    terms,
    blockExplorerIds,
    collapsedOnHomepage,
    defaultSummaryView,
    adminsAndMods,
    base,
    ss58Prefix,
    bech32Prefix,
    type,
    chatEnabled,
    decimals,
    substrateSpec,
    hideProjects,
    ChainNode,
    tokenName,
    address,
    adminOnlyPolling,
  }) {
    this.id = id;
    this.network = network;
    this.base = base;
    this.default_symbol = default_symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.website = website;
    this.discord = discord;
    this.element = element;
    this.telegram = telegram;
    this.github = github;
    this.stagesEnabled = stagesEnabled;
    this.customStages = customStages;
    this.customDomain = customDomain;
    this.snapshot = snapshot;
    this.terms = terms;
    this.snapshot = snapshot;
    this.blockExplorerIds = blockExplorerIds;
    this.collapsedOnHomepage = collapsedOnHomepage;
    this.defaultSummaryView = defaultSummaryView;
    this.adminsAndMods = adminsAndMods || [];
    this.type = type;
    this.chatEnabled = chatEnabled;
    this.ss58Prefix = ss58Prefix;
    this.bech32Prefix = bech32Prefix;
    this.decimals = decimals;
    this.substrateSpec = substrateSpec;
    this.hideProjects = hideProjects;
    this.ChainNode = ChainNode;
    this.tokenName = tokenName;
    this.address = address;
    this.adminOnlyPolling = adminOnlyPolling;
    this.communityBanner = null;
  }

  public static fromJSON({
    id,
    network,
    default_symbol,
    name,
    icon_url,
    description,
    website,
    discord,
    element,
    telegram,
    github,
    stages_enabled,
    custom_stages,
    custom_domain,
    snapshot,
    terms,
    block_explorer_ids,
    collapsed_on_homepage,
    default_summary_view,
    adminsAndMods,
    base,
    ss58_prefix,
    bech32_prefix,
    type,
    chat_enabled,
    substrate_spec,
    hide_projects,
    token_name,
    Contracts,
    ChainNode,
    admin_only_polling,
  }) {
    let blockExplorerIdsParsed;
    try {
      blockExplorerIdsParsed = JSON.parse(block_explorer_ids);
    } catch (e) {
      // ignore invalid JSON blobs
      block_explorer_ids = {};
    }
    const decimals = Contracts ? Contracts[0]?.decimals : 18;
    return new ChainInfo({
      id,
      network,
      default_symbol,
      name,
      iconUrl: icon_url,
      description,
      website,
      discord,
      element,
      telegram,
      github,
      stagesEnabled: stages_enabled,
      customStages: custom_stages,
      customDomain: custom_domain,
      snapshot,
      terms,
      blockExplorerIds: blockExplorerIdsParsed,
      collapsedOnHomepage: collapsed_on_homepage,
      defaultSummaryView: default_summary_view,
      adminsAndMods,
      base,
      ss58Prefix: ss58_prefix,
      bech32Prefix: bech32_prefix,
      type,
      chatEnabled: chat_enabled,
      decimals: parseInt(decimals, 10),
      substrateSpec: substrate_spec,
      hideProjects: hide_projects,
      tokenName: token_name,
      address: Contracts ? Contracts[0]?.address : '',
      ChainNode,
      adminOnlyPolling: admin_only_polling,
    });
  }

  // TODO: get operation should not have side effects, and either way this shouldn't be here
  public async getMembers(id: string) {
    try {
      const res = await $.get(`${app.serverUrl()}/bulkMembers`, { chain: id });
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
          r.permission,
          r.is_user_default
        )
      );
    });
  }

  public setBanner(banner_text: string) {
    this.communityBanner = banner_text;
  }

  // TODO: change to accept an object
  public async updateChainData({
    name,
    description,
    website,
    discord,
    element,
    telegram,
    github,
    stagesEnabled,
    customStages,
    customDomain,
    terms,
    snapshot,
    iconUrl,
    defaultSummaryView,
    hideProjects,
    chatEnabled,
  }) {
    // TODO: Change to PUT /chain
    const r = await $.post(`${app.serverUrl()}/updateChain`, {
      id: app.activeChainId(),
      name,
      description,
      website,
      discord,
      element,
      telegram,
      github,
      stages_enabled: stagesEnabled,
      custom_stages: customStages,
      custom_domain: customDomain,
      chat_enabled: chatEnabled,
      snapshot,
      terms,
      icon_url: iconUrl,
      default_summary_view: defaultSummaryView,
      hide_projects: hideProjects,
      jwt: app.user.jwt,
    });
    const updatedChain = r.result;
    this.name = updatedChain.name;
    this.description = updatedChain.description;
    this.website = updatedChain.website;
    this.discord = updatedChain.discord;
    this.element = updatedChain.element;
    this.telegram = updatedChain.telegram;
    this.github = updatedChain.github;
    this.hideProjects = updatedChain.hide_projects;
    this.stagesEnabled = updatedChain.stages_enabled;
    this.customStages = updatedChain.custom_stages;
    this.customDomain = updatedChain.custom_domain;
    this.snapshot = updatedChain.snapshot;
    this.terms = updatedChain.terms;
    this.iconUrl = updatedChain.icon_url;
    this.defaultSummaryView = updatedChain.default_summary_view;
    this.chatEnabled = updatedChain.chat_enabled;
  }

  public getAvatar(size: number) {
    return this.iconUrl
      ? m(CWAvatar, { avatarUrl: this.iconUrl, size })
      : m(CWJdenticon, { address: this.address || undefined, size });
  }
}

export default ChainInfo;
