import { z } from 'zod/v4';
import { AuthContext } from '../context';
import { Webhook } from '../entities/webhook.schemas';

export const GetWebhooks = {
  input: z.object({
    community_id: z.string().describe('The community_id to fetch webhooks for'),
  }),
  output: z.array(Webhook),
  context: AuthContext,
};
