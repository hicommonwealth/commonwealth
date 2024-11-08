import { z } from 'zod';
import { AuthContextSchema } from '../auth';
import { Webhook, WebhookSupportedEvents } from '../entities/webhook.schemas';

export const CreateWebhook = {
  input: z.object({
    community_id: z
      .string()
      .describe('The community_id the webhook is associated to'),
    webhookUrl: z.string(),
  }),
  output: Webhook,
  auth_context: AuthContextSchema,
};

export const GetWebhooks = {
  input: z.object({
    community_id: z.string().describe('The community_id to fetch webhooks for'),
  }),
  output: z.array(Webhook),
  auth_context: AuthContextSchema,
};

export const DeleteWebhook = {
  input: z.object({
    id: z.number().describe('The id of the webhook to delete'),
    community_id: z.string(),
  }),
  output: z.object({
    webhook_deleted: z.boolean(),
  }),
  auth_context: AuthContextSchema,
};

export const UpdateWebhook = {
  input: z.object({
    id: z.number().describe('The id of the webhook to update'),
    community_id: z.string(),
    events: z.array(WebhookSupportedEvents),
  }),
  output: Webhook,
  auth_context: AuthContextSchema,
};
