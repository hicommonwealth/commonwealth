/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../index';
/**
 * @example
 *     {
 *         id: "id"
 *     }
 */
export interface UpdateCommunityRequest {
  id: string;
  name?: string;
  chainNodeId?: number;
  defaultSymbol?: string;
  base?: CommonApi.UpdateCommunityRequestBase;
  iconUrl?: string;
  active?: boolean;
  type?: CommonApi.UpdateCommunityRequestType;
  description?: string;
  socialLinks?: CommonApi.UpdateCommunityRequestSocialLinksItem[];
  ss58Prefix?: number;
  stagesEnabled?: boolean;
  customStages?: string[];
  blockExplorerIds?: string;
  collapsedOnHomepage?: boolean;
  defaultSummaryView?: boolean;
  defaultPage?: CommonApi.UpdateCommunityRequestDefaultPage;
  hasHomepage?: CommonApi.UpdateCommunityRequestHasHomepage;
  terms?: CommonApi.UpdateCommunityRequestTerms;
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
  addresses?: CommonApi.UpdateCommunityRequestAddressesItem[];
  communityStakes?: CommonApi.UpdateCommunityRequestCommunityStakesItem[];
  communityTags?: CommonApi.UpdateCommunityRequestCommunityTagsItem[];
  chainNode?: CommonApi.UpdateCommunityRequestChainNode;
  topics?: CommonApi.UpdateCommunityRequestTopicsItem[];
  groups?: CommonApi.UpdateCommunityRequestGroupsItem[];
  contestManagers?: CommonApi.UpdateCommunityRequestContestManagersItem[];
  featuredTopics?: string[];
  snapshot?: CommonApi.UpdateCommunityRequestSnapshot;
  transactionHash?: string;
}
