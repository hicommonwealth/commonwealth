import { trpc } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityInteractionEvent,
} from '../../shared/analytics/types';

// TODO: mixpanel events for update community
/*
let mixpanelEvent: MixpanelCommunityInteractionEvent;
let communitySelected = null;

if (community.directory_page_enabled !== directory_page_enabled) {
  mixpanelEvent = directory_page_enabled
    ? MixpanelCommunityInteractionEvent.DIRECTORY_PAGE_ENABLED
    : MixpanelCommunityInteractionEvent.DIRECTORY_PAGE_DISABLED;

  if (directory_page_enabled) {
    communitySelected = await this.models.Community.findOne({
      where: { chain_node_id: directory_page_chain_node_id! },
    });
  }
}
const analyticsOptions = {
  event: mixpanelEvent,
  community: community.id,
  userId: user.id,
  isCustomDomain: null,
  ...(communitySelected && { communitySelected: communitySelected.id }),
};
*/

export const trpcRouter = trpc.router({
  createCommunity: trpc.command(Community.CreateCommunity, trpc.Tag.Community, [
    MixpanelCommunityCreationEvent.NEW_COMMUNITY_CREATION,
    (result) => ({
      chainBase: result.community?.base,
      community: result.community?.id,
    }),
  ]),
  updateCommunity: trpc.command(Community.UpdateCommunity, trpc.Tag.Community),
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
  createGroup: trpc.command(Community.CreateGroup, trpc.Tag.Community, [
    MixpanelCommunityInteractionEvent.CREATE_GROUP,
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
});
