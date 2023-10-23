import $ from 'jquery';
import type { RegisteredTypes } from '@polkadot/types/types';
import app from 'state';
import RoleInfo from './RoleInfo';
import type { ChainNetwork, DefaultPage } from 'common-common/src/types';
import { ChainBase } from 'common-common/src/types';
import type NodeInfo from './NodeInfo';
import { ETHERMINT_CHAINS } from 'controllers/app/webWallets/keplr_ethereum_web_wallet';
import axios from 'axios';

class ChainInfo {
  public readonly id: string;
  public readonly ChainNode: NodeInfo;
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
  public defaultOverview: boolean;
  public defaultPage: DefaultPage;
  public hasHomepage: boolean;
  public readonly chainObjectId: string;
  public adminsAndMods: RoleInfo[];
  public members: RoleInfo[];
  public type: string;
  public readonly ss58Prefix: string;
  public readonly bech32Prefix: string;
  public decimals: number;
  public substrateSpec: RegisteredTypes;
  public adminOnlyPolling: boolean;
  public communityBanner?: string;
  public discordConfigId?: string;
  public cosmosGovernanceVersion?: string;
  public discordBotWebhooksEnabled?: boolean;

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
    defaultOverview,
    defaultPage,
    hasHomepage,
    adminsAndMods,
    base,
    ss58_prefix,
    bech32_prefix,
    type,
    decimals,
    substrateSpec,
    ChainNode,
    tokenName,
    adminOnlyPolling,
    discord_config_id,
    cosmosGovernanceVersion,
    discordBotWebhooksEnabled,
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
    this.terms = terms;
    this.snapshot = snapshot;
    this.blockExplorerIds = blockExplorerIds;
    this.collapsedOnHomepage = collapsedOnHomepage;
    this.defaultOverview = defaultOverview;
    this.defaultPage = defaultPage;
    this.hasHomepage = hasHomepage;
    this.adminsAndMods = adminsAndMods || [];
    this.type = type;
    this.ss58Prefix = ss58_prefix;
    this.bech32Prefix = bech32_prefix;
    this.decimals = decimals;
    this.substrateSpec = substrateSpec;
    this.ChainNode = ChainNode;
    this.tokenName = tokenName;
    this.adminOnlyPolling = adminOnlyPolling;
    this.communityBanner = null;
    this.discordConfigId = discord_config_id;
    this.cosmosGovernanceVersion = cosmosGovernanceVersion;
    this.discordBotWebhooksEnabled = discordBotWebhooksEnabled;
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
    default_page,
    has_homepage,
    adminsAndMods,
    base,
    ss58_prefix,
    bech32_prefix,
    type,
    substrate_spec,
    token_name,
    Contracts,
    ChainNode,
    admin_only_polling,
    discord_config_id,
    discord_bot_webhooks_enabled,
  }) {
    let blockExplorerIdsParsed;
    try {
      blockExplorerIdsParsed = JSON.parse(block_explorer_ids);
    } catch (e) {
      // ignore invalid JSON blobs
      block_explorer_ids = {};
    }
    let decimals = Contracts
      ? Contracts[0]?.decimals
      : base === ChainBase.CosmosSDK
      ? 6
      : 18;

    if (ETHERMINT_CHAINS.some((c) => c === id)) {
      decimals = 18;
    }

    // TODO: this is temporary until we have a better way to handle governance versions
    // see: https://github.com/hicommonwealth/commonwealth/issues/3292
    const v1Chains = process.env.COSMOS_GOV_V1?.split(',');
    const cosmos_governance_version = v1Chains?.includes(id) ? 'v1' : 'v1beta1';

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
      defaultOverview: default_summary_view,
      defaultPage: default_page,
      hasHomepage: has_homepage,
      adminsAndMods,
      base,
      ss58_prefix,
      bech32_prefix,
      type,
      decimals: parseInt(decimals, 10),
      substrateSpec: substrate_spec,
      tokenName: token_name,
      ChainNode,
      adminOnlyPolling: admin_only_polling,
      discord_config_id,
      cosmosGovernanceVersion: cosmos_governance_version,
      discordBotWebhooksEnabled: discord_bot_webhooks_enabled,
    });
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
          r.allow,
          r.deny,
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
          r.allow,
          r.deny,
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
    defaultOverview,
    defaultPage,
    hasHomepage,
    chain_node_id,
    discord_bot_webhooks_enabled,
  }: {
    name?: string;
    description?: string;
    website?: string;
    discord?: string;
    element?: string;
    telegram?: string;
    github?: string;
    stagesEnabled?: boolean;
    customStages?: string;
    customDomain?: string;
    terms?: string;
    snapshot?: string[];
    iconUrl?: string;
    defaultOverview?: boolean;
    defaultPage?: DefaultPage;
    hasHomepage?: boolean;
    chain_node_id?: string;
    discord_bot_webhooks_enabled?: boolean;
  }) {
    const id = app.activeChainId() ?? this.id;
    const r = await axios.patch(`${app.serverUrl()}/communities/${id}`, {
      id,
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
      snapshot,
      terms,
      icon_url: iconUrl,
      default_summary_view: defaultOverview,
      default_page: defaultPage,
      has_homepage: hasHomepage,
      chain_node_id,
      discord_bot_webhooks_enabled,
      jwt: app.user.jwt,
    });
    const updatedChain = r.data.result;
    this.name = updatedChain.name;
    this.description = updatedChain.description;
    this.website = updatedChain.website;
    this.discord = updatedChain.discord;
    this.element = updatedChain.element;
    this.telegram = updatedChain.telegram;
    this.github = updatedChain.github;
    this.stagesEnabled = updatedChain.stages_enabled;
    this.customStages = updatedChain.custom_stages;
    this.customDomain = updatedChain.custom_domain;
    this.snapshot = updatedChain.snapshot;
    this.terms = updatedChain.terms;
    this.iconUrl = updatedChain.icon_url;
    this.defaultOverview = updatedChain.default_summary_view;
    this.defaultPage = updatedChain.default_page;
    this.hasHomepage = updatedChain.has_homepage;
    this.cosmosGovernanceVersion = updatedChain.cosmos_governance_version;
    this.discordBotWebhooksEnabled = updatedChain.discord_bot_webhooks_enabled;
  }
}

export default ChainInfo;
