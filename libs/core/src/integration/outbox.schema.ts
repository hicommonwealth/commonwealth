import { EventNames as E, events as P, PG_INT } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const BaseOutboxProperties = z.object({
  event_id: PG_INT.optional(),
  relayed: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const outboxEvents = {
  [E.ChainEventCreated]: P.ChainEventCreated,
  [E.CommentCreated]: P.CommentCreated,
  [E.CommentUpvoted]: P.CommentUpvoted,
  [E.CommunityCreated]: P.CommunityCreated,
  [E.ContestContentAdded]: P.ContestContentAdded,
  [E.ContestContentUpvoted]: P.ContestContentUpvoted,
  [E.ContestStarted]: P.ContestStarted,
  [E.ContestEnded]: P.ContestEnded,
  [E.ContestEnding]: P.ContestEnding,
  [E.DiscordMessageCreated]: P.DiscordMessageCreated,
  [E.DiscordThreadBodyUpdated]: P.DiscordThreadBodyUpdated,
  [E.DiscordThreadCommentCreated]: P.DiscordThreadCommentCreated,
  [E.DiscordThreadCommentDeleted]: P.DiscordThreadCommentDeleted,
  [E.DiscordThreadCommentUpdated]: P.DiscordThreadCommentUpdated,
  [E.DiscordThreadCreated]: P.DiscordThreadCreated,
  [E.DiscordThreadDeleted]: P.DiscordThreadDeleted,
  [E.DiscordThreadTitleUpdated]: P.DiscordThreadTitleUpdated,
  [E.FarcasterCastCreated]: P.FarcasterCastCreated,
  [E.FarcasterReplyCastCreated]: P.FarcasterReplyCastCreated,
  [E.FarcasterVoteCreated]: P.FarcasterVoteCreated,
  [E.FarcasterContestBotMentioned]: P.FarcasterContestBotMentioned,
  [E.GroupCreated]: P.GroupCreated,
  [E.OneOffContestManagerDeployed]: P.OneOffContestManagerDeployed,
  [E.RecurringContestManagerDeployed]: P.RecurringContestManagerDeployed,
  [E.SignUpFlowCompleted]: P.SignUpFlowCompleted,
  [E.SnapshotProposalCreated]: P.SnapshotProposalCreated,
  [E.SubscriptionPreferencesUpdated]: P.SubscriptionPreferencesUpdated,
  [E.ThreadCreated]: P.ThreadCreated,
  [E.ThreadUpvoted]: P.ThreadUpvoted,
  [E.UserMentioned]: P.UserMentioned,
  [E.QuestStarted]: P.QuestStarted,
} as const;

export const Outbox = z.union(
  Object.entries(outboxEvents).map(([event_name, event_payload]) =>
    z
      .object({
        event_name: z.literal(event_name as keyof typeof outboxEvents),
        event_payload,
      })
      .merge(BaseOutboxProperties),
  ) as unknown as readonly [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
);
