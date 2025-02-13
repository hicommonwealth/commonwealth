import { Events, events, PG_INT } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const BaseOutboxProperties = z.object({
  event_id: PG_INT.optional(),
  relayed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const outboxEvents: Events[] = [
  'CommentCreated',
  'CommentUpvoted',
  'CommunityCreated',
  'ContestContentAdded',
  'ContestContentUpvoted',
  'ContestStarted',
  'ContestEnded',
  'ContestEnding',
  'DiscordMessageCreated',
  'DiscordThreadBodyUpdated',
  'DiscordThreadCommentCreated',
  'DiscordThreadCommentDeleted',
  'DiscordThreadCommentUpdated',
  'DiscordThreadCreated',
  'DiscordThreadDeleted',
  'DiscordThreadTitleUpdated',
  'FarcasterCastCreated',
  'FarcasterReplyCastCreated',
  'FarcasterVoteCreated',
  'FarcasterContestBotMentioned',
  'GroupCreated',
  'OneOffContestManagerDeployed',
  'RecurringContestManagerDeployed',
  'SignUpFlowCompleted',
  'SnapshotProposalCreated',
  'SubscriptionPreferencesUpdated',
  'ThreadCreated',
  'ThreadUpvoted',
  'UserMentioned',
  'QuestStarted',
  'AddressOwnershipTransferred',
  'TwitterMomBotMentioned',
  'TwitterContestBotMentioned',
  'CommunityStakeTrade',
  'NamespaceDeployedWithReferral',
  'LaunchpadTokenCreated',
  'LaunchpadTrade',
  'ReferralFeeDistributed',
] as const;

export const Outbox = z.union(
  outboxEvents.map((event_name) =>
    z
      .object({
        event_name: z.literal(event_name),
        event_payload: events[event_name],
      })
      .merge(BaseOutboxProperties),
  ) as unknown as readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
);
