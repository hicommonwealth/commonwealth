import { trpc } from '@hicommonwealth/adapters';
import { SuperAdmin } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  triggerNotificationsWorkflow: trpc.command(
    SuperAdmin.TriggerNotificationsWorkflow,
    trpc.Tag.SuperAdmin,
  ),
});
