import { trpc } from '@hicommonwealth/adapters';
import { command } from '@hicommonwealth/core';
import {
  Community,
  middleware,
  models,
  refreshMemberships,
  refreshProfileCount,
} from '@hicommonwealth/model';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityInteractionEvent,
} from '../../shared/analytics/types';
import { config } from '../config';

export const trpcRouter = trpc.router({
  createCommunity: trpc.command(Community.CreateCommunity, trpc.Tag.Community, [
    trpc.fireAndForget(async (_, __, ctx) => {
      await middleware.incrementUserCount(ctx.actor.user.id!, 'creates');
    }),
    trpc.trackAnalytics([
      MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
      (output) => ({
        chainBase: output.community?.base,
        community: output.community?.id,
      }),
    ]),
  ]),
  updateCommunity: trpc.command(Community.UpdateCommunity, trpc.Tag.Community, [
    trpc.trackAnalytics(async (input, output) => {
      const { directory_page_enabled } = input;
      if (directory_page_enabled === undefined) return undefined;
      const event = directory_page_enabled
        ? MixpanelCommunityInteractionEvent.DIRECTORY_PAGE_ENABLED
        : MixpanelCommunityInteractionEvent.DIRECTORY_PAGE_DISABLED;
      // TODO: @timolegros is this a random selection?
      const dirnode = directory_page_enabled
        ? await models.Community.findOne({
            where: { chain_node_id: output.directory_page_chain_node_id },
          })
        : undefined;
      return [
        event,
        {
          community: output.id,
          isCustomDomain: null,
          communitySelected: dirnode?.id,
        },
      ];
    }),
  ]),
  getCommunities: trpc.query(Community.GetCommunities, trpc.Tag.Community, {
    ttlSecs: ({ relevance_by, include_node_info }) => {
      // (1h) Used by trending communities (user dashboard) when signed in
      if (relevance_by === 'membership')
        return config.CACHE_TTL.GET_COMMUNITIES_TRENDING_SIGNED_IN;
      // (24h) Used by join community onboarding modal
      else if (relevance_by === 'tag_ids')
        return config.CACHE_TTL.GET_COMMUNITIES_JOIN_COMMUNITY;
      // (24) Used by explore page
      else if (include_node_info) {
        // don't cache explore page since it is infinitely scrollable
        // caching first page but not subsequent could cause duplicates or
        // missing communities
        return undefined;
      }
      // (2h) Used by trending communities (user dashboard) when signed out
      return config.CACHE_TTL.GET_COMMUNITIES_TRENDING_SIGNED_OUT;
    },
  }),
  getCommunity: trpc.query(Community.GetCommunity, trpc.Tag.Community),
  // Add this to the existing router
  getCommunitySelectedTagsAndCommunities: trpc.query(
    Community.GetCommunitySelectedTagsAndCommunities,
    trpc.Tag.Community,
  ),
  getCommunityStake: trpc.query(
    Community.GetCommunityStake,
    trpc.Tag.Community,
  ),
  setCommunityStake: trpc.command(
    Community.SetCommunityStake,
    trpc.Tag.Community,
    [
      trpc.fireAndForget(async ({ community_id }, _, { actor }) => {
        // TODO: this is to reprocude the existing functionality, but it should be part of the command transaction
        // From legacy: since the stake is already created, generate group in background so this request doesn't fail
        await command(Community.GenerateStakeholderGroups(), {
          actor,
          payload: { id: community_id },
        });
      }),
    ],
  ),
  getStakeHistoricalPrice: trpc.query(
    Community.GetStakeHistoricalPrice,
    trpc.Tag.Community,
  ),
  getTransactions: trpc.query(Community.GetTransactions, trpc.Tag.Community),
  createGroup: trpc.command(Community.CreateGroup, trpc.Tag.Community, [
    (_, output) => refreshMemberships(output.id!, output.groups?.at(0)?.id),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_GROUP,
      (output) => ({ community: output.id }),
    ]),
  ]),
  updateGroup: trpc.command(Community.UpdateGroup, trpc.Tag.Community, [
    (input, output) => {
      if (input.requirements?.length || input.metadata?.required_requirements)
        return refreshMemberships(output.community_id!, output.id);
      return Promise.resolve();
    },
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.UPDATE_GROUP,
      (output) => ({ community: output.community_id }),
    ]),
  ]),
  getGroups: trpc.query(Community.GetGroups, trpc.Tag.Community),
  updateRole: trpc.command(Community.UpdateRole, trpc.Tag.Community),
  getMembers: trpc.query(Community.GetMembers, trpc.Tag.Community),
  getMemberships: trpc.query(Community.GetMemberships, trpc.Tag.Community),
  createStakeTransaction: trpc.command(
    Community.CreateStakeTransaction,
    trpc.Tag.Community,
  ),
  refreshCustomDomain: trpc.query(
    Community.RefreshCustomDomain,
    trpc.Tag.Community,
  ),
  updateCustomDomain: trpc.command(
    Community.UpdateCustomDomain,
    trpc.Tag.Community,
  ),
  getTopics: trpc.query(Community.GetTopics, trpc.Tag.Community),
  getTopicById: trpc.query(Community.GetTopicById, trpc.Tag.Community),
  updateTopicsOrder: trpc.command(
    Community.UpdateTopicsOrder,
    trpc.Tag.Community,
  ),
  createTopic: trpc.command(Community.CreateTopic, trpc.Tag.Community, [
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_TOPIC,
      (output) => ({
        community: output.topic.community_id,
        userId: output.user_id,
      }),
    ]),
  ]),
  updateTopic: trpc.command(Community.UpdateTopic, trpc.Tag.Community, [
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.UPDATE_TOPIC,
      (output) => ({
        community: output.topic.community_id,
        userId: output.user_id,
      }),
    ]),
  ]),
  updateTopicChannel: trpc.command(
    Community.UpdateTopicChannel,
    trpc.Tag.Community,
  ),
  toggleArchiveTopic: trpc.command(
    Community.ToggleArchiveTopic,
    trpc.Tag.Community,
  ),
  deleteGroup: trpc.command(Community.DeleteGroup, trpc.Tag.Community),
  deleteAddress: trpc.command(Community.DeleteAddress, trpc.Tag.Community, [
    (_, output) => refreshProfileCount(output.community_id),
  ]),
  deleteAllAddresses: trpc.command(
    Community.DeleteAllAddresses,
    trpc.Tag.Community,
    [(_, output) => refreshProfileCount(output.community_id)],
  ),
  deleteCommunity: trpc.command(Community.DeleteCommunity, trpc.Tag.Community),
  refreshCommunityMemberships: trpc.command(
    Community.RefreshCommunityMemberships,
    trpc.Tag.Community,
  ),
  selectCommunity: trpc.command(Community.SelectCommunity, trpc.Tag.Community),
  joinCommunity: trpc.command(Community.JoinCommunity, trpc.Tag.Community, [
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.JOIN_COMMUNITY,
      (output) => ({ community: output.community_id }),
    ]),
  ]),
  banAddress: trpc.command(Community.BanAddress, trpc.Tag.Community),
  getPinnedTokens: trpc.query(Community.GetPinnedTokens, trpc.Tag.Community),
  pinToken: trpc.command(Community.PinToken, trpc.Tag.Community),
  unpinToken: trpc.command(Community.UnpinToken, trpc.Tag.Community),
  updateCommunityTags: trpc.command(
    Community.UpdateCommunityTags,
    trpc.Tag.Community,
  ),
  updateCommunityDirectoryTags: trpc.command(
    Community.UpdateCommunityDirectoryTags,
    trpc.Tag.Community,
  ),
  getTopHolders: trpc.query(Community.GetTopHolders, trpc.Tag.Community),
  getRelatedCommunities: trpc.query(
    Community.GetRelatedCommunities,
    trpc.Tag.Community,
  ),
  searchCommunities: trpc.query(
    Community.SearchCommunities,
    trpc.Tag.Community,
  ),
  getCommunityStats: trpc.query(
    Community.GetCommunityStats,
    trpc.Tag.Community,
    { ttlSecs: 60 * 60 },
  ),
  updateBanner: trpc.command(Community.UpdateBanner, trpc.Tag.Community),
});
