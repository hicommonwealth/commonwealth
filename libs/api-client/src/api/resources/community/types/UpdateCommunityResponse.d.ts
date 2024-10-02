/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface UpdateCommunityResponse {
    id: string;
    name: string;
    chainNodeId?: number;
    defaultSymbol?: string;
    network?: string;
    base: CommonApi.UpdateCommunityResponseBase;
    iconUrl?: string;
    active: boolean;
    type?: CommonApi.UpdateCommunityResponseType;
    description?: string;
    socialLinks?: CommonApi.UpdateCommunityResponseSocialLinksItem[];
    ss58Prefix?: number;
    stagesEnabled?: boolean;
    customStages?: string[];
    customDomain?: string;
    blockExplorerIds?: string;
    collapsedOnHomepage?: boolean;
    defaultSummaryView?: boolean;
    defaultPage?: CommonApi.UpdateCommunityResponseDefaultPage;
    hasHomepage?: CommonApi.UpdateCommunityResponseHasHomepage;
    terms?: CommonApi.UpdateCommunityResponseTerms;
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
    addresses?: CommonApi.UpdateCommunityResponseAddressesItem[];
    communityStakes?: CommonApi.UpdateCommunityResponseCommunityStakesItem[];
    communityTags?: CommonApi.UpdateCommunityResponseCommunityTagsItem[];
    chainNode?: CommonApi.UpdateCommunityResponseChainNode;
    topics?: CommonApi.UpdateCommunityResponseTopicsItem[];
    groups?: CommonApi.UpdateCommunityResponseGroupsItem[];
    contestManagers?: CommonApi.UpdateCommunityResponseContestManagersItem[];
}
