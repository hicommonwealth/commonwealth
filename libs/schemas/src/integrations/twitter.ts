import { z } from 'zod';

export const Tweet = z.object({
  id: z.string(),
  author_id: z.string(),
  username: z.string(),
  created_at: z.string(),
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

export const TwitterMentionsTimeline = z.object({
  data: z.array(Tweet),
  errors: z.array(
    z.object({
      title: z.string(),
      type: z.string(),
      detail: z.string().optional(),
      status: z.number().optional(),
    }),
  ),
  meta: z
    .object({
      next_token: z.string().optional(),
    })
    .optional(),
});
