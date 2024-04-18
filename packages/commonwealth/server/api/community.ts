import { trpc } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getStake: trpc.query(Community.GetCommunityStake),
  getStakeTransaction: trpc.query(Community.GetStakeTransaction),
  getStakeHistoricalPrice: trpc.query(Community.GetStakeHistoricalPrice),
  setStake: trpc.command(Community.SetCommunityStake, trpc.Tag.Community),
  createGroup: trpc.command(Community.CreateGroup, trpc.Tag.Community),
  getMembers: trpc.query(Community.GetMembers),
  createStakeTransaction: trpc.command(
    Community.CreateStakeTransaction,
    trpc.Tag.Community,
  ),
  importDiscourseCommunity: trpc.command(
    Community.ImportDiscourseCommunity,
    trpc.Tag.Community,
  ),
  // TODO: integrate via async analytics policy: analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
});
