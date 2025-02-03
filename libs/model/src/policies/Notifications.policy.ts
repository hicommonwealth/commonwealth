import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { notifyChainEventCreated } from './handlers/notifyChainEventCreated';
import { notifyCommentCreated } from './handlers/notifyCommentCreated';
import { notifyCommentUpvoted } from './handlers/notifyCommentUpvoted';
import { notifyContestEvent } from './handlers/notifyContestEvent';
import { notifySnapshotProposalCreated } from './handlers/notifySnapshotProposalCreated';
import { notifyThreadCreated } from './handlers/notifyThreadCreated';
import { notifyThreadUpvoted } from './handlers/notifyThreadUpvoted';
import { notifyUserMentioned } from './handlers/notifyUserMentioned';

const notificationInputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
  ChainEventCreated: events.ChainEventCreated,
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
  UserMentioned: events.UserMentioned,
  ThreadUpvoted: events.ThreadUpvoted,
  CommentUpvoted: events.CommentUpvoted,
  // Contest Events
  ContestEnding: events.ContestEnding,
  ContestEnded: events.ContestEnded,
};

export function NotificationsPolicy(): Policy<typeof notificationInputs> {
  return {
    inputs: notificationInputs,
    body: {
      SnapshotProposalCreated: async (event) => {
        await notifySnapshotProposalCreated(event);
      },
      ChainEventCreated: async (event) => {
        await notifyChainEventCreated(event);
      },
      ThreadCreated: async (event) => {
        await notifyThreadCreated(event);
      },
      CommentCreated: async (event) => {
        await notifyCommentCreated(event);
      },
      UserMentioned: async (event) => {
        await notifyUserMentioned(event);
      },
      ThreadUpvoted: async (event) => {
        await notifyThreadUpvoted(event);
      },
      CommentUpvoted: async (event) => {
        await notifyCommentUpvoted(event);
      },
      ContestEnding: async (event) => {
        await notifyContestEvent(event);
      },
      ContestEnded: async (event) => {
        await notifyContestEvent(event);
      },
    },
  };
}
