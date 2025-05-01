import { trpc } from '@hicommonwealth/adapters';
import { SuperAdmin } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
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
});
