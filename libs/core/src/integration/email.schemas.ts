import { z } from 'zod';
import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
} from './notifications.schemas';

export const GetRecapEmailData = {
  input: z.object({
    user_id: z.string(),
  }),
  output: z.object({
    discussion: z.array(
      z.union([
        CommentCreatedNotification.extend({
          author_avatar_url: z.string(),
        }),
        UserMentionedNotification.extend({
          author_avatar_url: z.string(),
        }),
      ]),
    ),
    protocol: z.array(
      CommunityStakeNotification.extend({
        community_icon_url: z.string(),
      }),
    ),
    governance: z.array(
      z.union([
        ChainProposalsNotification.extend({
          community_icon_url: z.string(),
        }),
        SnapshotProposalCreatedNotification.extend({
          community_icon_url: z.string(),
        }),
      ]),
    ),
  }),
};
