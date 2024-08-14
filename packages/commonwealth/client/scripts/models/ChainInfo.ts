import { ExtendedCommunity } from '@hicommonwealth/schemas';
import type { AddressRole, DefaultPage } from '@hicommonwealth/shared';
import { ChainBase } from '@hicommonwealth/shared';
import { z } from 'zod';
import { getCosmosChains } from '../controllers/app/webWallets/utils';
import NodeInfo from './NodeInfo';
import StakeInfo from './StakeInfo';
import Tag from './Tag';

class ChainInfo {
  public readonly id: string;
  public readonly chainNodeId: string;
  public readonly ChainNode: NodeInfo;
  public readonly CommunityStakes: StakeInfo[];
  public CommunityTags: Tag[];
  public readonly tokenName: string;
  public threadCount: number;
  public readonly profileCount: number;
  public readonly default_symbol: string;
  public name: string;
  public readonly network: string;
  public readonly base: ChainBase;
  public iconUrl: string;
  public description: string;
  public socialLinks: string[];
  public stagesEnabled: boolean;
  public customStages: string[];
  public customDomain: string;
  public snapshot: string[];
  public terms: string;
  public readonly blockExplorerIds: { [id: string]: string };
  public readonly collapsedOnHomepage: boolean;
  public defaultOverview: boolean;
  public defaultPage: DefaultPage;
  public hasHomepage: boolean;
  public readonly chainObjectId: string;
  public adminsAndMods: AddressRole[];
  public type: string;
  public readonly ss58Prefix: string;
  public readonly bech32Prefix: string;
  public decimals: number;
  public adminOnlyPolling: boolean;
  public communityBanner?: string;
  public discordConfigId?: string;
  public discordBotWebhooksEnabled?: boolean;
  public directoryPageEnabled?: boolean;
  public directoryPageChainNodeId?: number;
  public namespace?: string;
  public redirect?: string;
  public numTotalThreads?: number;
  public numVotingThreads?: number;

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
    social_links,
    stagesEnabled,
    customStages,
    customDomain,
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
    chain_node_id,
    ChainNode,
    CommunityStakes,
    CommunityTags,
    tokenName,
    adminOnlyPolling,
    discord_config_id,
    discordBotWebhooksEnabled,
    directoryPageEnabled,
    directoryPageChainNodeId,
    namespace,
    redirect,
    thread_count,
    profile_count,
    snapshot_spaces,
    communityBanner,
  }) {
    this.id = id;
    this.network = network;
    this.base = base;
    this.default_symbol = default_symbol;
    this.name = name;
    this.iconUrl = iconUrl;
    this.description = description;
    this.socialLinks = social_links;
    this.stagesEnabled = stagesEnabled;
    this.customStages = customStages;
    this.customDomain = customDomain;
    this.terms = terms;
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
    this.chainNodeId = chain_node_id;
    this.ChainNode = ChainNode;
    this.CommunityStakes = CommunityStakes;
    this.CommunityTags = CommunityTags;
    this.tokenName = tokenName;
    this.adminOnlyPolling = adminOnlyPolling;
    this.communityBanner = communityBanner;
    this.discordConfigId = discord_config_id;
    this.discordBotWebhooksEnabled = discordBotWebhooksEnabled;
    this.directoryPageEnabled = directoryPageEnabled;
    this.directoryPageChainNodeId = directoryPageChainNodeId;
    this.namespace = namespace;
    this.redirect = redirect;
    this.threadCount = thread_count;
    this.profileCount = profile_count;
    this.snapshot = snapshot_spaces || [];
  }

  public static fromJSON({
    id,
    network,
    default_symbol,
    name,
    icon_url,
    description,
    social_links,
    stages_enabled,
    custom_stages,
    custom_domain,
    terms,
    block_explorer_ids,
    collapsed_on_homepage,
    default_summary_view,
    default_page,
    has_homepage,
    base,
    ss58_prefix,
    bech32_prefix,
    type,
    token_name,
    Contracts,
    chain_node_id,
    ChainNode,
    admin_only_polling,
    discord_config_id,
    discord_bot_webhooks_enabled,
    directory_page_enabled,
    directory_page_chain_node_id,
    namespace,
    redirect,
    thread_count,
    profile_count,
    CommunityStakes,
    CommunityTags,
    snapshot_spaces,
    Addresses,
    adminsAndMods,
    communityBanner,
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

    if (getCosmosChains(true)?.some((c) => c === id)) {
      decimals = 18;
    }

    return new ChainInfo({
      id,
      network,
      default_symbol,
      name,
      iconUrl: icon_url,
      description,
      social_links,
      stagesEnabled: stages_enabled,
      customStages: custom_stages,
      customDomain: custom_domain,
      terms,
      blockExplorerIds: blockExplorerIdsParsed,
      collapsedOnHomepage: collapsed_on_homepage,
      defaultOverview: default_summary_view,
      defaultPage: default_page,
      hasHomepage: has_homepage,
      base,
      ss58_prefix,
      bech32_prefix,
      type,
      decimals: parseInt(decimals, 10),
      tokenName: token_name,
      chain_node_id,
      ChainNode: ChainNode,
      CommunityStakes: CommunityStakes?.map((c) => new StakeInfo(c)) ?? [],
      CommunityTags: CommunityTags?.map((t) => new Tag(t)) ?? [],
      adminOnlyPolling: admin_only_polling,
      discord_config_id,
      discordBotWebhooksEnabled: discord_bot_webhooks_enabled,
      directoryPageEnabled: directory_page_enabled,
      directoryPageChainNodeId: directory_page_chain_node_id,
      namespace,
      redirect,
      thread_count,
      profile_count,
      snapshot_spaces,
      adminsAndMods: adminsAndMods || Addresses,
      communityBanner,
    });
  }

  // TODO: 8811 cleanup `ChainInfo`
  public static fromTRPCResponse(
    community: z.infer<typeof ExtendedCommunity>,
  ): ChainInfo {
    return ChainInfo.fromJSON({
      Addresses: community.Addresses,
      admin_only_polling: community.admin_only_polling,
      base: community.base,
      bech32_prefix: community.bech32_prefix,
      block_explorer_ids: community.block_explorer_ids,
      chain_node_id: community.chain_node_id,
      ChainNode: new NodeInfo({
        alt_wallet_url: community?.ChainNode?.alt_wallet_url,
        balance_type: community?.ChainNode?.balance_type,
        bech32: community?.ChainNode?.bech32,
        block_explorer: community?.ChainNode?.block_explorer,
        cosmos_chain_id: community?.ChainNode?.cosmos_chain_id,
        cosmos_gov_version: community?.ChainNode?.cosmos_gov_version,
        eth_chain_id: community?.ChainNode?.eth_chain_id,
        id: community?.ChainNode?.id,
        name: community?.ChainNode?.name,
        slip44: community?.ChainNode?.slip44,
        url: community?.ChainNode?.url,
      }),
      collapsed_on_homepage: community.collapsed_on_homepage,
      CommunityStakes: community.CommunityStakes,
      CommunityTags: community.CommunityTags,
      custom_domain: community.custom_domain,
      custom_stages: community.custom_stages,
      default_page: community.default_page,
      default_summary_view: community.default_summary_view,
      default_symbol: community.default_symbol,
      description: community.description,
      directory_page_chain_node_id: community.directory_page_chain_node_id,
      directory_page_enabled: community.directory_page_enabled,
      discord_bot_webhooks_enabled: community.discord_bot_webhooks_enabled,
      token_name: community.token_name,
      has_homepage: community.has_homepage,
      discord_config_id: community.discord_config_id,
      icon_url: community.icon_url,
      name: community.name,
      id: community.id,
      redirect: community.redirect,
      namespace: community.namespace,
      network: community.network,
      snapshot_spaces: community.snapshot_spaces,
      stages_enabled: community.stages_enabled,
      terms: community.terms,
      thread_count: community.numTotalThreads,
      social_links: community.social_links,
      ss58_prefix: community.ss58_prefix,
      type: community.type,
      adminsAndMods: community?.adminsAndMods || [],
      communityBanner: community?.communityBanner || '',
      // these don't come from /communities/:id response and need to be added in
      // api response when needed
      Contracts: [],
      profile_count: 0,
    });
  }
}
export default ChainInfo;
