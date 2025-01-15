import { trpc } from '@hicommonwealth/adapters';
import { command } from '@hicommonwealth/core';
import {
  Community,
  decrementProfileCount,
  models,
} from '@hicommonwealth/model';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityInteractionEvent,
} from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createCommunity: trpc.command(Community.CreateCommunity, trpc.Tag.Community, [
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
  getCommunities: trpc.query(Community.GetCommunities, trpc.Tag.Community),
  getCommunity: trpc.query(Community.GetCommunity, trpc.Tag.Community),
  getStake: trpc.query(Community.GetCommunityStake, trpc.Tag.Community),
  getTransactions: trpc.query(Community.GetTransactions, trpc.Tag.Community),
  getStakeHistoricalPrice: trpc.query(
    Community.GetStakeHistoricalPrice,
    trpc.Tag.Community,
  ),
  setStake: trpc.command(Community.SetCommunityStake, trpc.Tag.Community),
  createGroup: trpc.command(Community.CreateGroup, trpc.Tag.Community, [
    trpc.fireAndForget(async (_, output, ctx) => {
      await command(Community.RefreshCommunityMemberships(), {
        actor: ctx.actor,
        payload: {
          community_id: output.id!,
          group_id: output.groups?.at(0)?.id,
        },
      });
    }),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_GROUP,
      (output) => ({ community: output.id }),
    ]),
  ]),
  updateGroup: trpc.command(Community.UpdateGroup, trpc.Tag.Community, [
    trpc.fireAndForget(async (input, output, ctx) => {
      if (input.requirements?.length || input.metadata?.required_requirements)
        await command(Community.RefreshCommunityMemberships(), {
          actor: ctx.actor,
          payload: {
            community_id: output.community_id!,
            group_id: output.id,
          },
        });
    }),
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.UPDATE_GROUP,
      (output) => ({ community: output.community_id }),
    ]),
  ]),
  getMembers: trpc.query(Community.GetMembers, trpc.Tag.Community),
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
  toggleArchiveTopic: trpc.command(
    Community.ToggleArchiveTopic,
    trpc.Tag.Community,
  ),
  deleteGroup: trpc.command(Community.DeleteGroup, trpc.Tag.Community),
  deleteAddress: trpc.command(Community.DeleteAddress, trpc.Tag.Community, [
    trpc.fireAndForget(async (_, output, ctx) => {
      await decrementProfileCount(output.community_id, ctx.actor.user.id!);
    }),
  ]),
  deleteAllAddresses: trpc.command(
    Community.DeleteAllAddresses,
    trpc.Tag.Community,
    [
      trpc.fireAndForget(async (_, output, ctx) => {
        await decrementProfileCount(output.community_id, ctx.actor.user.id!);
      }),
    ],
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
});
