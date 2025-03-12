import { z } from 'zod';

export const Tweet = z.object({
  id: z.string(),
  author_id: z.string(),
  username: z.string(),
  created_at: z.coerce.date(),
  text: z.string().describe('The first 280 characters of the tweet'),
  note_tweet: z
    .string()
    .optional()
    .describe('The full tweet text including anything above 280 characters'),
  conversation_id: z.string().optional(),
  reply_settings: z
    .enum([
      'everyone',
      'mentionedUsers',
      'following',
      'other',
      'subscribers',
      'verified',
    ])
    .optional(),
});

export const TwitterMentionsTimelineResponse = z.object({
  data: z
    .array(
      z.object({
        text: z.string(),
        id: z.string(),
        created_at: z.string(),
        author_id: z.string(),
      }),
    )
    .optional(),
  includes: z
    .object({
      users: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          username: z.string(),
        }),
      ),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        title: z.string(),
        type: z.string(),
        detail: z.string().optional(),
        status: z.number().optional(),
      }),
    )
    .optional(),
  meta: z
    .object({
      next_token: z.string().optional(),
    })
    .optional(),
});

export const TwitterUserResponse = z.object({
  data: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
  }),
});

export const TweetsWithMetricsResponse = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      public_metrics: z.object({
        retweet_count: z.number(),
        reply_count: z.number(),
        like_count: z.number(),
        quote_count: z.number(),
        impression_count: z.number(),
        bookmark_count: z.number(),
      }),
    }),
  ),
  errors: z
    .array(
      z.object({
        title: z.string(),
        type: z.string(),
        detail: z.string().optional(),
        status: z.number().optional(),
      }),
    )
    .optional(),
});

// TODO: simplify

export const LikingUsersResponse = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
      }),
    )
    .optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        detail: z.string(),
        title: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});

export const RetweetsResponse = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
      }),
    )
    .optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        detail: z.string(),
        title: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});

export const RepliesResponse = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        author_id: z.string(),
        created_at: z.string(),
        conversation_id: z.string(),
      }),
    )
    .optional(),
  meta: z
    .object({
      newest_id: z.string(),
      oldest_id: z.string(),
      result_count: z.number(),
      next_token: z.string().optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        detail: z.string(),
        title: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
});
