import { z } from 'zod';
import { PG_INT } from '../utils';

export const ThreadFeed = {
  input: z.object({}),
  output: z
    .object({
      thread_id: PG_INT,
      last_activity: z.coerce.string(),
      notification_data: z.string(),
      category_id: z.string(),
      comment_count: PG_INT,
      commenters: z.array(
        z.object({
          Addresses: z.array(
            z.object({
              id: PG_INT,
              address: z.string(),
              community_id: z.string(),
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
      block_number: PG_INT,
      community_id: z.string(),
    })
    .array(),
};
