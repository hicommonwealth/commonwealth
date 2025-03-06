import z from 'zod';
import { events } from '../events';
import { PG_INT } from '../utils';

export const QuestEvents = {
  SignUpFlowCompleted: events.SignUpFlowCompleted,
  CommunityCreated: events.CommunityCreated,
  CommunityJoined: events.CommunityJoined,
  ThreadCreated: events.ThreadCreated,
  ThreadUpvoted: events.ThreadUpvoted,
  CommentCreated: events.CommentCreated,
  CommentUpvoted: events.CommentUpvoted,
  UserMentioned: events.UserMentioned,
  RecurringContestManagerDeployed: events.RecurringContestManagerDeployed,
  OneOffContestManagerDeployed: events.OneOffContestManagerDeployed,
  LaunchpadTokenCreated: events.LaunchpadTokenCreated,
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
  WalletLinked: events.WalletLinked,
  SSOLinked: events.SSOLinked,
  CommonDiscordServerJoined: events.CommonDiscordServerJoined,
  XpChainEventCreated: events.XpChainEventCreated,
  TwitterCommonMentioned: events.TwitterCommonMentioned,
} as const;

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
    //event names instead of enums for flexibility when adding new events
    event_name: z.enum(
      Object.keys(QuestEvents) as [
        keyof typeof QuestEvents,
        ...Array<keyof typeof QuestEvents>,
      ],
    ),
    reward_amount: z.number(),
    creator_reward_weight: z.number().min(0).max(1).default(0),
    amount_multiplier: z.number().min(0).optional(),
    participation_limit: z.nativeEnum(QuestParticipationLimit).optional(),
    participation_period: z.nativeEnum(QuestParticipationPeriod).optional(),
    instructions_link: z.string().url().optional().nullish(),
    participation_times_per_period: z.number().optional(),
    content_id: z
      .string()
      .regex(/(thread:\d+)|(comment:\d+)/)
      .optional()
      .nullish(),
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
    name: z.string().max(255),
    description: z.string().max(1000),
    image_url: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    xp_awarded: z.number().default(0),
    max_xp_to_end: z.number().default(0),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    community_id: z
      .string()
      .nullish()
      .describe('Links the quest to a single community'),

    // associations
    action_metas: z.array(QuestActionMeta).optional(),
  })
  .describe(
    'A quest is a collection of actions that users can take to earn rewards',
  );

export const QuestTweet = z
  .object({
    tweet_id: z.string(),
    tweet_url: z.string(),
    quest_action_meta_id: z.number(),
    retweet_cap: z.number(),
    like_cap: z.number(),
    replies_cap: z.number(),
    num_likes: z.number().optional().default(0),
    num_retweets: z.number().optional().default(0),
    num_replies: z.number().optional().default(0),
    ended_at: z.coerce.date().nullish(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),

    QuestActionMeta: QuestActionMeta.optional(),
  })
  .describe('A tweet associated to a quest from which XP can be earned');
