import z from 'zod';
import { PaginatedResultSchema } from '../framework';
import { Address } from './address.schemas';

export const Comment = z.object({
  thread_id: z.string(),
  address_id: z.number(),
  text: z.string(),
  plaintext: z.string(),
  id: z.number().optional(),
  community_id: z.string(),
  parent_id: z.string().optional(),
  version_history: z.array(z.string()).optional(),

  canvas_action: z.string(),
  canvas_session: z.string(),
  canvas_hash: z.string(),

  created_at: z.any(),
  updated_at: z.any(),
  deleted_at: z.any(),
  marked_as_spam_at: z.any(),

  discord_meta: z
    .object({
      user: z.object({
        id: z.string(),
        username: z.string(),
      }),
      channel_id: z.string(),
      message_id: z.string(),
    })
    .optional(),

  reaction_count: z.number(),
  reaction_weights_sum: z.number().optional(),

  Address: Address.optional(),
});

export const SearchComments = {
  input: z.object({
    community_id: z.string(),
    search: z.string(),
    limit: z.number().int().optional().default(20),
    page: z.number().int().optional().default(1),
    orderBy: z.string().optional().default('created_at'),
    orderDirection: z.enum(['ASC', 'DESC']).default('DESC'),
  }),
  output: PaginatedResultSchema(Comment),
};
