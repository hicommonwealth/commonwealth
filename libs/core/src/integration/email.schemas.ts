import { z } from 'zod';
import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
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
    stake: z.array(
      CommunityStakeNotification.extend({
        community_logo_url: z.string(),
      }),
    ),
    governance: z.array(
      ChainProposalsNotification.extend({
        community_logo_url: z.string(),
      }),
    ),
  }),
};
