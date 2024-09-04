import { trpc } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityInteractionEvent,
} from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createCommunity: trpc.command(
    Community.CreateCommunity,
    trpc.Tag.Community,
    trpc.track(
      MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
      (result) => ({
        chainBase: result.community?.base,
        community: result.community?.id,
      }),
    ),
  ),
  getCommunities: trpc.query(Community.GetCommunities, trpc.Tag.Community),
  getCommunity: trpc.query(Community.GetCommunity, trpc.Tag.Community),
  getStake: trpc.query(Community.GetCommunityStake, trpc.Tag.Community),
  getStakeTransaction: trpc.query(
    Community.GetStakeTransaction,
    trpc.Tag.Community,
  ),
  getStakeHistoricalPrice: trpc.query(
    Community.GetStakeHistoricalPrice,
    trpc.Tag.Community,
  ),
  setStake: trpc.command(Community.SetCommunityStake, trpc.Tag.Community),
  createGroup: trpc.command(
    Community.CreateGroup,
    trpc.Tag.Community,
    trpc.track(MixpanelCommunityInteractionEvent.CREATE_GROUP),
  ),
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
  // TODO: integrate via async analytics policy: analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
});
