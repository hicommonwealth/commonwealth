/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface CreateCommunityResponseCommunity {
  id: string;
  name: string;
  chainNodeId?: number;
  defaultSymbol?: string;
  network?: string;
  base: CommonApi.CreateCommunityResponseCommunityBase;
  iconUrl?: string;
  active: boolean;
  type?: CommonApi.CreateCommunityResponseCommunityType;
  description?: string;
  socialLinks?: CommonApi.CreateCommunityResponseCommunitySocialLinksItem[];
  ss58Prefix?: number;
  stagesEnabled?: boolean;
  customStages?: string[];
  customDomain?: string;
  blockExplorerIds?: string;
  collapsedOnHomepage?: boolean;
  defaultSummaryView?: boolean;
  defaultPage?: CommonApi.CreateCommunityResponseCommunityDefaultPage;
  hasHomepage?: CommonApi.CreateCommunityResponseCommunityHasHomepage;
  terms?: CommonApi.CreateCommunityResponseCommunityTerms;
  adminOnlyPolling?: boolean;
  bech32Prefix?: string;
  hideProjects?: boolean;
  tokenName?: string;
  ceVerbose?: boolean;
  discordConfigId?: number;
  category?: unknown;
  discordBotWebhooksEnabled?: boolean;
  directoryPageEnabled?: boolean;
  directoryPageChainNodeId?: number;
  namespace?: string;
  namespaceAddress?: string;
  redirect?: string;
  snapshotSpaces?: string[];
  includeInDigestEmail?: boolean;
  profileCount?: number;
  lifetimeThreadCount?: number;
  bannerText?: string;
  createdAt?: Date;
  updatedAt?: Date;
  addresses?: CommonApi.CreateCommunityResponseCommunityAddressesItem[];
  communityStakes?: CommonApi.CreateCommunityResponseCommunityCommunityStakesItem[];
  communityTags?: CommonApi.CreateCommunityResponseCommunityCommunityTagsItem[];
  chainNode?: CommonApi.CreateCommunityResponseCommunityChainNode;
  topics?: CommonApi.CreateCommunityResponseCommunityTopicsItem[];
  groups?: CommonApi.CreateCommunityResponseCommunityGroupsItem[];
  contestManagers?: CommonApi.CreateCommunityResponseCommunityContestManagersItem[];
}
