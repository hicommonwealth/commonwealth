import { trpc } from '@hicommonwealth/adapters';
import { Community } from '@hicommonwealth/model';

export default trpc.router({
  getStake: trpc.query(Community.GetCommunityStake(), trpc.authenticate),
  setStake: trpc.command(Community.SetCommunityStake(), trpc.authenticate),
  createGroup: trpc.command(Community.CreateGroup(), trpc.authenticate),
  //analyticsMiddleware(MixpanelCommunityInteractionEvent.CREATE_GROUP),
});
