import z from 'zod';
import { PG_INT } from '../utils';

export enum QuestParticipationLimit {
  Once = 'once',
  OncePerPeriod = 'once_per_period',
}

export enum QuestPeriod {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export enum QuestActionType {
  Post = 'post',
  Comment = 'comment',
  Vote = 'vote',
  LinkingSso = 'linking_sso',
  BuyingToken = 'buying_token',
  SellingToken = 'selling_token',
}

export enum QuestRewardType {
  Token = 'token',
  NFT = 'nft',
}

export const QuestActionMeta = z
  .object({
    quest_id: PG_INT, // PK
    action_type: z.nativeEnum(QuestActionType), // PK
    description: z.string().max(255).optional(), // do we need this?
    period: z.nativeEnum(QuestPeriod).optional(),
    participation_limit: z.nativeEnum(QuestParticipationLimit).optional(),
    reward_type: z.nativeEnum(QuestRewardType),
    reward_amount: z.number().optional(),
    token_id: z.string().optional(),
    token_address: z.string().optional(),
    token_name: z.string().optional(),
    token_symbol: z.string().optional(),
    token_decimals: z.number().optional(),
    created_at: z.coerce.date().optional(),
  })
  .describe('Quest action type, participation limits, and reward');

export const QuestScore = z
  .object({
    quest_id: PG_INT,
    user_id: PG_INT,
    score: z.number(),
    created_at: z.coerce.date().optional(),
  })
  .describe(
    'Records the score of a user in a quest, by accumulating their action values',
  );

export const Quest = z
  .object({
    id: PG_INT.nullish(),
    name: z.string().max(255),
    description: z.string().max(1000),
    community_id: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),

    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),

    // final projected scores or real-time scores?
    scores: z.array(QuestScore).nullish(),
  })
  .describe(
    'A quest is a collection of actions that users can take to earn rewards',
  );

export const QuestAction = z
  .object({
    quest_id: PG_INT,
    user_id: PG_INT,
    action_id: PG_INT,
    created_at: z.coerce.date().optional(),
  })
  .describe('Records user actions in a quest');
