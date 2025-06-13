import { z } from 'zod';
import { AuthContext } from '../context';
import { ChainEventXpSource } from '../entities/chain-event-xp-source.schemas';
import { CommunityGoalMeta } from '../entities/community.schemas';
import {
  GeneralQuestAction,
  KyoFinanceLpQuestAction,
  KyoFinanceSwapQuestAction,
  Quest,
  QuestTweet,
} from '../entities/quest.schemas';
import { PaginatedResultSchema, PaginationParamsSchema } from './pagination';

// Define the extended versions of the shared schemas
const QuestTweetView = QuestTweet.extend({
  created_at: z.coerce.date().or(z.string()).optional(),
  updated_at: z.coerce.date().or(z.string()).optional(),
});

const ChainEventXpSourceView = ChainEventXpSource.extend({
  created_at: z.coerce.date().or(z.string()).optional(),
  updated_at: z.coerce.date().or(z.string()).optional(),
});

const CommunityGoalMetaView = CommunityGoalMeta.extend({
  created_at: z.coerce.date().or(z.string()).optional(),
});

// Helper to extend any quest action variant for the view
function extendQuestActionForView<T extends z.ZodRawShape>(
  base: z.ZodObject<T>,
) {
  return base.extend({
    QuestTweet: QuestTweetView.nullish(),
    ChainEventXpSource: ChainEventXpSourceView.nullish(),
    CommunityGoalMeta: CommunityGoalMetaView.nullish(),
    created_at: z.coerce.date().or(z.string()).optional(),
    updated_at: z.coerce.date().or(z.string()).optional(),
  });
}

const KyoFinanceSwapQuestActionView = extendQuestActionForView(
  KyoFinanceSwapQuestAction,
);
const KyoFinanceLpQuestActionView = extendQuestActionForView(
  KyoFinanceLpQuestAction,
);
const GeneralQuestActionView = extendQuestActionForView(GeneralQuestAction);

export const QuestActionView = z.discriminatedUnion('event_name', [
  KyoFinanceSwapQuestActionView,
  KyoFinanceLpQuestActionView,
  GeneralQuestActionView,
]);

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
