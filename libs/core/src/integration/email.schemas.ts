import { Thread } from '@hicommonwealth/schemas';
import { z } from 'zod';
import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
} from './notifications.schemas';

export const EnrichedCommentCreatedNotification =
  CommentCreatedNotification.extend({
    author_avatar_url: z.string(),
  });

export const EnrichedUserMentionedNotification =
  UserMentionedNotification.extend({
    author_avatar_url: z.string(),
  });

export const EnrichedCommunityStakeNotification =
  CommunityStakeNotification.extend({
    community_icon_url: z.string(),
  });

export const EnrichedChainProposalsNotification =
  ChainProposalsNotification.extend({
    community_icon_url: z.string(),
  });

export const EnrichedSnapshotProposalCreatedNotification =
  SnapshotProposalCreatedNotification.extend({
    community_icon_url: z.string(),
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
