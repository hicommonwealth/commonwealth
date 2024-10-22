/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { UpdateCommunityResponseAddressesItem } from './UpdateCommunityResponseAddressesItem';
import { UpdateCommunityResponseBase } from './UpdateCommunityResponseBase';
import { UpdateCommunityResponseChainNode } from './UpdateCommunityResponseChainNode';
import { UpdateCommunityResponseCommunityStakesItem } from './UpdateCommunityResponseCommunityStakesItem';
import { UpdateCommunityResponseCommunityTagsItem } from './UpdateCommunityResponseCommunityTagsItem';
import { UpdateCommunityResponseContestManagersItem } from './UpdateCommunityResponseContestManagersItem';
import { UpdateCommunityResponseDefaultPage } from './UpdateCommunityResponseDefaultPage';
import { UpdateCommunityResponseGroupsItem } from './UpdateCommunityResponseGroupsItem';
import { UpdateCommunityResponseHasHomepage } from './UpdateCommunityResponseHasHomepage';
import { UpdateCommunityResponseSocialLinksItem } from './UpdateCommunityResponseSocialLinksItem';
import { UpdateCommunityResponseTerms } from './UpdateCommunityResponseTerms';
import { UpdateCommunityResponseTopicsItem } from './UpdateCommunityResponseTopicsItem';
import { UpdateCommunityResponseType } from './UpdateCommunityResponseType';
export const UpdateCommunityResponse = core.serialization.object({
  id: core.serialization.string(),
  name: core.serialization.string(),
  chainNodeId: core.serialization.property(
    'chain_node_id',
    core.serialization.number().optional(),
  ),
  defaultSymbol: core.serialization.property(
    'default_symbol',
    core.serialization.string().optional(),
  ),
  network: core.serialization.string().optional(),
  base: UpdateCommunityResponseBase,
  iconUrl: core.serialization.property(
    'icon_url',
    core.serialization.string().optional(),
  ),
  active: core.serialization.boolean(),
  type: UpdateCommunityResponseType.optional(),
  description: core.serialization.string().optional(),
  socialLinks: core.serialization.property(
    'social_links',
    core.serialization.list(UpdateCommunityResponseSocialLinksItem).optional(),
  ),
  ss58Prefix: core.serialization.property(
    'ss58_prefix',
    core.serialization.number().optional(),
  ),
  stagesEnabled: core.serialization.property(
    'stages_enabled',
    core.serialization.boolean().optional(),
  ),
  customStages: core.serialization.property(
    'custom_stages',
    core.serialization.list(core.serialization.string()).optional(),
  ),
  customDomain: core.serialization.property(
    'custom_domain',
    core.serialization.string().optional(),
  ),
  blockExplorerIds: core.serialization.property(
    'block_explorer_ids',
    core.serialization.string().optional(),
  ),
  collapsedOnHomepage: core.serialization.property(
    'collapsed_on_homepage',
    core.serialization.boolean().optional(),
  ),
  defaultSummaryView: core.serialization.property(
    'default_summary_view',
    core.serialization.boolean().optional(),
  ),
  defaultPage: core.serialization.property(
    'default_page',
    UpdateCommunityResponseDefaultPage.optional(),
  ),
  hasHomepage: core.serialization.property(
    'has_homepage',
    UpdateCommunityResponseHasHomepage.optional(),
  ),
  terms: UpdateCommunityResponseTerms.optional(),
  adminOnlyPolling: core.serialization.property(
    'admin_only_polling',
    core.serialization.boolean().optional(),
  ),
  bech32Prefix: core.serialization.property(
    'bech32_prefix',
    core.serialization.string().optional(),
  ),
  hideProjects: core.serialization.property(
    'hide_projects',
    core.serialization.boolean().optional(),
  ),
  tokenName: core.serialization.property(
    'token_name',
    core.serialization.string().optional(),
  ),
  ceVerbose: core.serialization.property(
    'ce_verbose',
    core.serialization.boolean().optional(),
  ),
  discordConfigId: core.serialization.property(
    'discord_config_id',
    core.serialization.number().optional(),
  ),
  category: core.serialization.unknown().optional(),
  discordBotWebhooksEnabled: core.serialization.property(
    'discord_bot_webhooks_enabled',
    core.serialization.boolean().optional(),
  ),
  directoryPageEnabled: core.serialization.property(
    'directory_page_enabled',
    core.serialization.boolean().optional(),
  ),
  directoryPageChainNodeId: core.serialization.property(
    'directory_page_chain_node_id',
    core.serialization.number().optional(),
  ),
  namespace: core.serialization.string().optional(),
  namespaceAddress: core.serialization.property(
    'namespace_address',
    core.serialization.string().optional(),
  ),
  redirect: core.serialization.string().optional(),
  snapshotSpaces: core.serialization.property(
    'snapshot_spaces',
    core.serialization.list(core.serialization.string()).optional(),
  ),
  includeInDigestEmail: core.serialization.property(
    'include_in_digest_email',
    core.serialization.boolean().optional(),
  ),
  profileCount: core.serialization.property(
    'profile_count',
    core.serialization.number().optional(),
  ),
  lifetimeThreadCount: core.serialization.property(
    'lifetime_thread_count',
    core.serialization.number().optional(),
  ),
  bannerText: core.serialization.property(
    'banner_text',
    core.serialization.string().optional(),
  ),
  createdAt: core.serialization.property(
    'created_at',
    core.serialization.date().optional(),
  ),
  updatedAt: core.serialization.property(
    'updated_at',
    core.serialization.date().optional(),
  ),
  addresses: core.serialization.property(
    'Addresses',
    core.serialization.list(UpdateCommunityResponseAddressesItem).optional(),
  ),
  communityStakes: core.serialization.property(
    'CommunityStakes',
    core.serialization
      .list(UpdateCommunityResponseCommunityStakesItem)
      .optional(),
  ),
  communityTags: core.serialization.property(
    'CommunityTags',
    core.serialization
      .list(UpdateCommunityResponseCommunityTagsItem)
      .optional(),
  ),
  chainNode: core.serialization.property(
    'ChainNode',
    UpdateCommunityResponseChainNode.optional(),
  ),
  topics: core.serialization.list(UpdateCommunityResponseTopicsItem).optional(),
  groups: core.serialization.list(UpdateCommunityResponseGroupsItem).optional(),
  contestManagers: core.serialization.property(
    'contest_managers',
    core.serialization
      .list(UpdateCommunityResponseContestManagersItem)
      .optional(),
  ),
});
