import z from 'zod';
import { events } from '../events';
import { PG_INT } from '../utils';

export const ChannelQuestEvents = {
  CommonDiscordServerJoined: events.CommonDiscordServerJoined,
  XpChainEventCreated: events.XpChainEventCreated,
  TwitterCommonMentioned: events.TwitterCommonMentioned,
} as const;
// Channel quest action types that are not event related
export const ChannelBatchActions = ['TweetEngagement'] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AllChannelQuestActionNames = [
  ...(Object.keys(ChannelQuestEvents) as [
    keyof typeof ChannelQuestEvents,
    ...Array<keyof typeof ChannelQuestEvents>,
  ]),
  ...ChannelBatchActions,
] as const;

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
  ContestEnded: events.ContestEnded,
  LaunchpadTokenCreated: events.LaunchpadTokenCreated,
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
  WalletLinked: events.WalletLinked,
  SSOLinked: events.SSOLinked,
  NamespaceLinked: events.NamespaceLinked,
  CommunityGoalReached: events.CommunityGoalReached,
  MembershipsRefreshed: events.MembershipsRefreshed,
  ...ChannelQuestEvents,
} as const;

export const QuestActionNames = [
  ...(Object.keys(QuestEvents) as [
    keyof typeof QuestEvents,
    ...Array<keyof typeof QuestEvents>,
  ]),
  ...ChannelBatchActions,
];

export enum QuestParticipationLimit {
  OncePerQuest = 'once_per_quest',
  OncePerPeriod = 'once_per_period',
}

export enum QuestParticipationPeriod {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export const QuestTweet = z
  .object({
    tweet_id: z.string(),
    tweet_url: z.string(),
    quest_action_meta_id: z.number().optional(),
    retweet_cap: z.number().optional(),
    like_cap: z.number().optional(),
    replies_cap: z.number().optional(),
    num_likes: z.number().default(0).optional(),
    num_retweets: z.number().default(0).optional(),
    num_replies: z.number().default(0).optional(),
    like_xp_awarded: z.boolean().default(false).optional(),
    reply_xp_awarded: z.boolean().default(false).optional(),
    retweet_xp_awarded: z.boolean().default(false).optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  })
  .describe('A tweet associated to a quest from which XP can be earned');

export const QuestActionMeta = z
  .object({
    id: z.number().nullish(),
    quest_id: z.number(),
    //event names instead of enums for flexibility when adding new events
    event_name: z.enum([
      ...(Object.keys(QuestEvents) as [
        keyof typeof QuestEvents,
        ...Array<keyof typeof QuestEvents>,
      ]),
      ...ChannelBatchActions,
    ]),
    reward_amount: z.number(),
    creator_reward_weight: z.number().min(0).max(1).default(0),
    amount_multiplier: z.number().min(0).optional(),
    participation_limit: z.nativeEnum(QuestParticipationLimit).optional(),
    participation_period: z.nativeEnum(QuestParticipationPeriod).optional(),
    instructions_link: z.string().url().optional().nullish(),
    participation_times_per_period: z.number().optional(),
    content_id: z
      .string()
      .regex(
        /(chain:\d+)|(topic:\d+)|(thread:\d+)|(comment:\d+)|(group:\d+)|(wallet:\w+)|(sso:\w+)|(goal:\d+)|(threshold:\d+)|(tweet_url:https:\/\/x\.com\/[^]+\/status\/[^]+)|(discord_server_url:https:\/\/discord\.(com\/invite\/|gg\/?)\w+)/,
      )
      .optional()
      .nullish(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),

    // associations
    QuestTweet: QuestTweet.optional(),
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
    id: z.number().nullish(),
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
    quest_type: z.enum(['channel', 'common']),
    scheduled_job_id: z.string().nullish(),

    // associations
    action_metas: z.array(QuestActionMeta).optional(),
  })
  .describe(
    'A quest is a collection of actions that users can take to earn rewards',
  );
