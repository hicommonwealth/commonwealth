import { z } from 'zod';
import { PG_INT } from '../utils';
import { QuestActionMeta } from './quest.schemas';
import { User } from './user.schemas';

export const XpLogName = z.enum([
  'tweet_engagement_retweet',
  'tweet_engagement_reply',
  'tweet_engagement_like',
]);

export const XpLog = z.object({
  id: PG_INT.optional(),
  action_meta_id: z.number(),
  user_id: PG_INT,
  event_created_at: z.coerce.date(),
  name: XpLogName.nullish(),
  xp_points: PG_INT,
  creator_user_id: PG_INT.nullish(),
  creator_xp_points: PG_INT.nullish(),
  created_at: z.coerce.date(),

  // associations
  user: User.optional(),
  creator: User.optional(),
  quest_action_meta: QuestActionMeta.optional(),
});
