import z from 'zod';
import { PG_INT } from '../utils';

// Should we move all event names to libs/schemas?
export const QUEST_EVENTS = [
  'CommentCreated',
  'CommentUpvoted',
  'ThreadCreated',
  'ThreadUpvoted',
  'UserMentioned',
] as const;

export enum QuestParticipationLimit {
  OncePerQuest = 'once_per_quest',
  OncePerPeriod = 'once_per_period',
}

export enum QuestParticipationPeriod {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export const QuestActionMeta = z
  .object({
    id: PG_INT.nullish(),
    quest_id: PG_INT,
    event_name: z.enum(QUEST_EVENTS), // using event names instead of enums to allow more flexibility when adding new events
    reward_amount: z.number(),
    creator_reward_weight: z.number().min(0).max(1).default(0),
    participation_limit: z.nativeEnum(QuestParticipationLimit).optional(),
    participation_period: z.nativeEnum(QuestParticipationPeriod).optional(),
    participation_times_per_period: z.number().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .describe('Quest action metadata associated to a quest instance');

export const QuestScore = z
  .object({
    user_id: PG_INT,
    points: z.number(),
    period: z.nativeEnum(QuestParticipationPeriod).optional(),
  })
  .describe('Value type with user total/period score');

export const Quest = z
  .object({
    id: PG_INT.nullish(),
    community_id: z.string(),
    name: z.string().max(255),
    description: z.string().max(1000),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),

    // associations
    action_metas: z.array(QuestActionMeta).optional(),
  })
  .describe(
    'A quest is a collection of actions that users can take to earn rewards',
  );

export const QuestAction = z
  .object({
    user_id: PG_INT.describe('The user who took the action'),
    quest_action_meta_id: PG_INT.describe('The action metadata for the action'),
    created_at: z.coerce.date().optional(),
  })
  .describe('Records user actions in a quest');
