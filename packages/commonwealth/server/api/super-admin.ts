import { trpc } from '@hicommonwealth/adapters';
import { SuperAdmin } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createChainNode: trpc.command(
    SuperAdmin.CreateChainNode,
    trpc.Tag.SuperAdmin,
  ),
  updateCommunityId: trpc.command(
    SuperAdmin.UpdateCommunityId,
    trpc.Tag.SuperAdmin,
  ),
  getChainNodes: trpc.query(SuperAdmin.GetChainNodes, trpc.Tag.SuperAdmin),
  triggerNotificationsWorkflow: trpc.command(
    SuperAdmin.TriggerNotificationsWorkflow,
    trpc.Tag.SuperAdmin,
  ),
  enableDigestEmail: trpc.command(
    SuperAdmin.EnableDigestEmail,
    trpc.Tag.SuperAdmin,
  ),
  updateResourceTimestamps: trpc.command(
    SuperAdmin.UpdateResourceTimestamps,
    trpc.Tag.SuperAdmin,
  ),
  setCommunityTier: trpc.command(
    SuperAdmin.SetCommunityTier,
    trpc.Tag.SuperAdmin,
  ),
  setUserTier: trpc.command(SuperAdmin.SetUserTier, trpc.Tag.SuperAdmin),
  getStats: trpc.query(SuperAdmin.GetStats, trpc.Tag.SuperAdmin),
  getTopUsers: trpc.query(SuperAdmin.GetTopUsers, trpc.Tag.SuperAdmin),
  updateSiteAdmin: trpc.command(
    SuperAdmin.UpdateSiteAdmin,
    trpc.Tag.SuperAdmin,
  ),
  getCommunityMembersStats: trpc.query(
    SuperAdmin.GetCommunityMembersStats,
    trpc.Tag.SuperAdmin,
  ),
  createCommunityGoalMeta: trpc.command(
    SuperAdmin.CreateCommunityGoalMeta,
    trpc.Tag.SuperAdmin,
  ),
});
