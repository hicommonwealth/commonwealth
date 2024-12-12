import { Thread } from '@hicommonwealth/schemas';
import { z } from 'zod';
import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
} from './notifications.schemas';

export const EnrichedNotificationNames = {
  CommentCreated: 'CommentCreated',
  UserMentioned: 'UserMentioned',
  CommunityStakeTrade: 'CommunityStakeTrade',
  ChainProposal: 'ChainProposal',
  SnapshotProposalCreated: 'SnapshotProposalCreated',
} as const;

export const EnrichedCommentCreatedNotification =
  CommentCreatedNotification.extend({
    event_name: z.literal(EnrichedNotificationNames.CommentCreated),
    author_avatar_url: z.string(),
    inserted_at: z
      .string()
      .describe(
        'The string date at which a notification was registered with a notification provider',
      ),
  });

export const EnrichedUserMentionedNotification =
  UserMentionedNotification.extend({
    event_name: z.literal(EnrichedNotificationNames.UserMentioned),
    author_avatar_url: z.string().nullish(),
    inserted_at: z
      .string()
      .describe(
        'The string date at which a notification was registered with a notification provider',
      ),
  });

export const EnrichedCommunityStakeNotification =
  CommunityStakeNotification.extend({
    event_name: z.literal(EnrichedNotificationNames.CommunityStakeTrade),
    community_icon_url: z.string().nullish(),
    inserted_at: z
      .string()
      .describe(
        'The string date at which a notification was registered with a notification provider',
      ),
  });

export const EnrichedChainProposalsNotification =
  ChainProposalsNotification.extend({
    event_name: z.literal(EnrichedNotificationNames.ChainProposal),
    community_icon_url: z.string().nullish(),
    inserted_at: z
      .string()
      .describe(
        'The string date at which a notification was registered with a notification provider',
      ),
  });

export const EnrichedSnapshotProposalCreatedNotification =
  SnapshotProposalCreatedNotification.extend({
    event_name: z.literal(EnrichedNotificationNames.SnapshotProposalCreated),
    community_icon_url: z.string().nullish(),
    inserted_at: z
      .string()
      .describe(
        'The string date at which a notification was registered with a notification provider',
      ),
  });

export const GetRecapEmailData = {
  input: z.object({
    user_id: z.string(),
  }),

  output: z.object({
    discussion: z.array(
      z.union([
        EnrichedCommentCreatedNotification,
        EnrichedUserMentionedNotification,
      ]),
    ),
    protocol: z.array(EnrichedCommunityStakeNotification),
    governance: z.array(
      z.union([
        EnrichedChainProposalsNotification,
        EnrichedSnapshotProposalCreatedNotification,
      ]),
    ),
    num_notifications: z.number(),
    notifications_link: z.string(),
    unsubscribe_link: z.string(),
  }),
};

export const EnrichedThread = Thread.extend({
  name: z
    .string()
    .describe('The name of the community that the thread belongs to'),
  icon_url: z
    .string()
    .describe('The icon url of the community that the thread belongs to'),
});

export const GetDigestEmailData = {
  input: z.object({}),
  output: z.record(z.string(), z.array(EnrichedThread)),
};
