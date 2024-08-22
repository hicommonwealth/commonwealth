import { Webhook } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const CreateWebhook = {
  input: z.object({
    id: z.string().describe('The community_id the webhook is associated to'),
    webhookUrl: z.string(),
  }),
  output: Webhook,
};
