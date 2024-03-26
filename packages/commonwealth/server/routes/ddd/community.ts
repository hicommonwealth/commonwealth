import { trpc } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getStake: trpc.query(Community.GetCommunityStake),
  setStake: trpc.command(Community.SetCommunityStake, trpc.Tag.Community),
  createGroup: trpc.command(Community.CreateGroup, trpc.Tag.Community),
  getMembers: trpc.query(Community.GetMembers),
  // TODO: integrate via async analytics policy: analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
});
