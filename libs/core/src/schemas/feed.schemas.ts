import z from 'zod';

export const ViewUserActivity = {
  input: z.object({}),
  output: z.object({
    result: z
      .object({
        thread_id: z.number(),
        last_activity: z.string(),
        notification_data: z.string(),
        category_id: z.string(),
        comment_count: z.number(),
        commenters: z
          .object({
            Addresses: z
              .object({
                id: z.number(),
                address: z.string(),
                community_id: z.string(),
                profile_id: z.number(),
              })
              .array(),
          })
          .array(),
      })
      .array(),
  }),
};
