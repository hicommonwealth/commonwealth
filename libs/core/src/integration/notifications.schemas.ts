import { z } from 'zod';
import * as events from './events.schemas';

// TODO: make this stricter by adding max/min character length
export const CommentCreatedNotification = z.object({
  author: z
    .string()
    .describe('The profile name or first 8 characters of a users address'),
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

export const UserMentionedNotification = z.object({
  author_address_id: z.number().describe("The id of the author's address"),
  author_user_id: z.number().describe("The id of the author's user record"),
  author_address: z.string().max(255).describe('The address of the author'),
  author_profile_id: z
    .number()
    .describe('The profile id of the author of the mention'),
  community_id: z.string().max(255).describe('The id of the community'),
  community_name: z
    .string()
    .max(255)
    .describe('The user-friendly name of the community'),
  author: z
    .string()
    .describe('The profile name or first 8 characters of a users address'),
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
