import { trpc } from '@hicommonwealth/adapters';
import { Webhook } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createWebhook: trpc.command(Webhook.CreateWebhook, trpc.Tag.Webhook),
  getWebhooks: trpc.query(Webhook.GetWebhooks, trpc.Tag.Webhook),
  deleteWebhook: trpc.command(Webhook.DeleteWebhook, trpc.Tag.Webhook),
  updateWebhook: trpc.command(Webhook.UpdateWebhook, trpc.Tag.Webhook),
});
