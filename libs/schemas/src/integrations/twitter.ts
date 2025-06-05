import { z } from 'zod/v4';

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

const GetResponseBase = z.object({
  data: z.any(),
  errors: z
    .array(
      z.object({
        detail: z.string(),
        title: z.string(),
        type: z.string(),
      }),
    )
    .optional(),
  meta: z
    .object({
      result_count: z.number(),
      next_token: z.string().optional(),
    })
    .optional(),
});

export const GetTwitterMentionsTimelineResponse = GetResponseBase.extend({
  data: z
    .array(
      z.object({
        text: z.string(),
        id: z.string(),
        created_at: z.coerce.date(),
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
}).transform((org) => {
  if (!org.data || !org.includes)
    return org as {
      data: undefined;
      includes: undefined;
      errors: z.infer<typeof GetResponseBase>['errors'];
      meta: z.infer<typeof GetResponseBase>['meta'];
    };

  const userMap = new Map(org.includes.users.map((user) => [user.id, user]));
  const username = userMap.get(org.data[0].author_id)?.username;
  if (!username) throw new Error('Could not find username');

  const enrichedData = org.data.map((reply) => ({
    ...reply,
    username,
  }));

  return {
    ...org,
    data: enrichedData,
  };
});

export const GetTwitterUserResponse = GetResponseBase.extend({
  data: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
  }),
});

export const GetTweetsWithMetricsResponse = GetResponseBase.extend({
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
});

const GenericUsersResponse = GetResponseBase.extend({
  data: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
      }),
    )
    .optional(),
});

export const GetLikingUsersResponse = GenericUsersResponse;

export const GetRetweetsResponse = GenericUsersResponse;

export const GetRepliesResponse = GetResponseBase.extend({
  data: z
    .array(
      z.object({
        id: z.string(),
        author_id: z.string(),
        created_at: z.coerce.date(),
        conversation_id: z.string(),
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
}).transform((org) => {
  if (!org.data || !org.includes)
    return org as {
      data: undefined;
      includes: undefined;
      errors: z.infer<typeof GetResponseBase>['errors'];
      meta: z.infer<typeof GetResponseBase>['meta'];
    };

  const userMap = new Map(org.includes.users.map((user) => [user.id, user]));
  const username = userMap.get(org.data[0].author_id)?.username;
  if (!username) throw new Error('Could not find username');

  const enrichedData = org.data.map((reply) => ({
    ...reply,
    username,
  }));

  return {
    ...org,
    data: enrichedData,
  };
});

export const TwitterApiResponses = {
  GetLikingUsersResponse,
  GetRetweetsResponse,
  GetRepliesResponse,
  GetTweetsWithMetricsResponse,
  GetTwitterMentionsTimelineResponse,
  GetTwitterUserResponse,
} as const;
