import { trpc } from '@hicommonwealth/adapters';
import { SuperAdmin } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  triggerNotificationWorkflow: trpc.command(
    SuperAdmin.TriggerNotificationsWorkflow,
    trpc.Tag.SuperAdmin,
  ),
});
