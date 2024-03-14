import { z } from 'zod';

export const GetUserActivity = {
  input: z.object({}),
  output: z.object({
    result: z.array(
      z.object({
        thread_id: z.number(),
        last_activity: z.date(),
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
      }),
    ),
  }),
};
