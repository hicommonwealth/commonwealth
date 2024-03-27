import { z } from 'zod';

export const ThreadFeed = {
  input: z.object({}),
  output: z
    .object({
      thread_id: z.number(),
      last_activity: z.coerce.string(),
      notification_data: z.string(),
      category_id: z.string(),
      comment_count: z.number(),
      commenters: z.array(
        z.object({
          Addresses: z.array(
            z.object({
              id: z.number(),
              address: z.string(),
              community_id: z.string(),
              profile_id: z.number(),
            }),
          ),
        }),
      ),
    })
    .array(),
};

export const ChainFeed = {
  input: z.object({}),
  output: z
    .object({
      network: z.string(),
      event_data: z.object({
        id: z.string(),
        kind: z.string(),
      }),
      block_number: z.number(),
      community_id: z.string(),
    })
    .array(),
};
