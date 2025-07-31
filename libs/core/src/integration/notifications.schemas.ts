import { events } from '@hicommonwealth/schemas';
import { z } from 'zod';

/**
 * Schema descriptions in this file are intentionally verbose as they are
 * intended to be used by external teams (Growth/Product) to determine what
 * data is available to them in a notifications workflow (e.g. Knock).
 */

const NotificationAuthor = z.object({
  author: z.string(),
  author_address_id: z
    .number()
    .describe("The id of the author's address")
    .optional(),
  author_address: z
    .string()
    .max(255)
    .describe('The address of the author')
    .optional(),
  author_user_id: z.string().optional(),
  author_profile_url: z.string().optional(),
  author_email: z.string().optional(),
  author_avatar_url: z.string().optional(),
});

// TODO: make this stricter by adding max/min character length
export const CommentCreatedNotification = NotificationAuthor.extend({
  comment_parent_name: z
    .union([z.literal('thread'), z.literal('comment')])
    .describe(
      'Defines whether the comment is a top-level (aka root) comment on the thread or a reply to an existing comment',
    ),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  comment_body: z
    .string()
    .max(255)
    .describe('A truncated version of the comment body'),
  comment_url: z.string().describe('The url of the comment'),
  comment_created_event: events.CommentCreated.describe(
    'The full comment record',
  ),
});

export const SnapshotProposalCreatedNotification = z.object({
  community_id: z.string().max(255).describe('The community id'),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  space_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the Snapshot space'),
  snapshot_proposal_url: z
    .string()
    .describe('The url to the snapshot proposal on Common'),
});

export const UserMentionedNotification = NotificationAuthor.extend({
  community_id: z.string().max(255).describe('The id of the community'),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  object_body: z
    .string()
    .max(255)
    .describe('A truncated version of the comment body'),
  object_url: z.string().describe('The url of the comment'),
});

export const CommunityStakeNotification = z.object({
  community_id: z.string().max(255).describe('The community id'),
  transaction_type: z
    .union([z.literal('minted'), z.literal('burned')])
    .describe('The type of stake transaction'),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  community_stakes_url: z.string().describe('The url to the community stakes'),
});

export const ChainProposalsNotification = z.object({
  community_id: z.string().max(255).describe('The community id'),
  proposal_kind: z.union([
    z.literal('proposal-created'),
    z.literal('proposal-queued'),
    z.literal('proposal-executed'),
    z.literal('proposal-canceled'),
  ]),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  proposal_url: z
    .string()
    .describe('The url to the snapshot proposal on Common'),
});

export const BaseUpvoteNotification = NotificationAuthor.extend({
  community_id: z
    .string()
    .max(255)
    .describe('The community id in which the reaction was created'),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  reaction: z
    .enum(['like'])
    .describe('The type of reaction. Currently only like is supported.'),
  created_at: z
    .string()
    .max(255)
    .describe('The ISO string date at which the reaction was created.'),
  object_url: z.string().describe('The url of the thread or comment'),
});

export const ThreadUpvoteNotification = BaseUpvoteNotification.extend({
  thread_id: z
    .number()
    .describe('The id of the thread on which the reaction occurred'),
  thread_title: z
    .string()
    .max(255)
    .describe('A truncated version of the thread title'),
});

export const CommentUpvoteNotification = BaseUpvoteNotification.extend({
  comment_id: z
    .number()
    .describe('The id of the comment on which the reaction occurred'),
  comment_body: z
    .string()
    .max(255)
    .describe('A truncated version of the comment body'),
});

export const UpvoteNotification = z.union([
  ThreadUpvoteNotification,
  CommentUpvoteNotification,
]);

export const AddressOwnershipTransferredNotification = z.object({
  community_id: z.string(),
  community_name: z.string(),
  address: z.string(),
  user_id: z.number(),
  old_user_id: z.number(),
  old_user_email: z.string(),
  created_at: z.string(),
});

export const WebhookNotification = z.object({
  sender_username: z.literal('Common'),
  sender_avatar_url: z
    .string()
    .describe('The avatar url of the sender e.g. default commonwealth logo'),
  community_id: z.string().max(255).describe('The community id'),
  title_prefix: z
    .string()
    .max(255)
    .describe('A title prefix such as "New Thread: "'),
  preview_image_url: z.string().describe('The preview image of the content'),
  preview_image_alt_text: z.string(),
  profile_name: z.string().max(255).describe('The profile name of the author'),
  profile_url: z.string(),
  profile_avatar_url: z.string(),
  author_user_id: z.number().describe('The id of the author user record'),
  thread_title: z.string(),
  object_url: z.string(),
  object_summary: z.string(),
  content_url: z.string().nullish(),
  content_type: z.union([z.literal('thread'), z.literal('comment')]),
  thread_id: z.number().describe('The id of the thread'),
  comment_id: z.number().optional().describe('The id of the comment'),
});

export const ContestNotification = z.object({
  contest_id: z.number(),
  start_time: z.date(),
  end_time: z.date(),
  contest_name: z.string(),
  image_url: z.string(),
  community_id: z.string(),
  community_name: z.string(),
});

export const ContestEndedNotification = ContestNotification.extend({
  winners: z
    .object({
      address: z.string(),
      content: z.string(),
      name: z.string(),
      votes: z.string(),
      prize: z.string(),
    })
    .array(),
});

export const QuestStartedNotification = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  image_url: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  community_id: z.string().nullish(),
});

export const ReferrerSignedUpNotification = z.object({
  referee_user_id: z.number(),
  referee_profile_name: z.string(),
  referee_profile_avatar_url: z.string(),
});

export const ReferrerCommunityJoinedNotification = z.object({
  community_id: z.string(),
  community_name: z.string(),
  community_icon_url: z.string(),
  referee_user_id: z.number(),
  referee_profile_name: z.string(),
  referee_profile_avatar_url: z.string(),
});

export const ReferrerCommunityCreatedNotification = z.object({
  community_id: z.string(),
  community_name: z.string(),
  community_icon_url: z.string(),
  referee_user_id: z.number(),
  referee_profile_name: z.string(),
  referee_profile_avatar_url: z.string(),
});

export const TradeEventNotification = z.object({
  community_id: z.string().describe('The community associated with the token'),
  symbol: z.string().describe('The token symbol'),
  is_buy: z.boolean().describe('If the trade was a buy or sell'),
});

export const CapReachedNotification = z.object({
  community_id: z.string().describe('The community associated with the token'),
  symbol: z.string().describe('The token symbol'),
});

export const ThreadTokenTradeEventNotification = z.object({
  community_id: z.string().describe('The community associated with the token'),
  thread_id: z.number().describe('The thread associated with the token'),
  symbol: z.string().describe('The token symbol'),
  is_buy: z.boolean().describe('If the trade was a buy or sell'),
});

export const ThreadTokenCapReachedNotification = z.object({
  community_id: z.string().describe('The community associated with the token'),
  thread_id: z.number().describe('The thread associated with the token'),
  symbol: z.string().describe('The token symbol'),
});
