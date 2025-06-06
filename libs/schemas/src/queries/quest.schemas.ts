import { z } from 'zod/v4';
import { AuthContext } from '../context';
import {
  ChainEventXpSource,
  CommunityGoalMeta,
  Quest,
  QuestActionMeta,
  QuestTweet,
} from '../entities';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

export const QuestActionView = QuestActionMeta.extend({
  QuestTweet: QuestTweet.extend({
    created_at: z.coerce.date().or(z.string()).optional(),
    updated_at: z.coerce.date().or(z.string()).optional(),
  }).nullish(),
  ChainEventXpSource: ChainEventXpSource.extend({
    created_at: z.coerce.date().or(z.string()).optional(),
    updated_at: z.coerce.date().or(z.string()).optional(),
  }).nullish(),
  CommunityGoalMeta: CommunityGoalMeta.extend({
    created_at: z.coerce.date().or(z.string()).optional(),
  }).nullish(),
  created_at: z.coerce.date().or(z.string()).optional(),
  updated_at: z.coerce.date().or(z.string()).optional(),
});

export const QuestView = Quest.omit({ scheduled_job_id: true }).extend({
  id: z.number(),
  start_date: z.coerce.date().or(z.string()),
  end_date: z.coerce.date().or(z.string()),
  created_at: z.coerce.date().or(z.string()).optional(),
  updated_at: z.coerce.date().or(z.string()).optional(),
  action_metas: z.array(QuestActionView).optional(),
});

export const GetQuest = {
  input: z.object({ quest_id: z.number() }),
  output: QuestView.optional(),
  context: AuthContext,
};

export const GetQuests = {
  input: PaginationParamsSchema.extend({
    community_id: z.string().optional(),
    start_after: z.coerce.date().optional(),
    start_before: z.coerce.date().optional(),
    end_after: z.coerce.date().optional(),
    end_before: z.coerce.date().optional(),
    include_system_quests: z.boolean().default(false).optional(),
  }),
  output: PaginatedResultSchema.extend({
    results: z.array(QuestView),
  }),
};
