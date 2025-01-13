import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { processChainEventCreated } from './handlers/chainEventCreated';
import { processCommentCreated } from './handlers/commentCreated';
import { processCommentUpvoted } from './handlers/commentUpvoted';
import { processSnapshotProposalCreated } from './handlers/snapshotProposalCreated';
import { processThreadCreated } from './handlers/threadCreated';
import { processThreadUpvoted } from './handlers/threadUpvoted';
import { processUserMentioned } from './handlers/userMentioned';

const notificationInputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
  ChainEventCreated: events.ChainEventCreated,
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
  UserMentioned: events.UserMentioned,
  ThreadUpvoted: events.ThreadUpvoted,
  CommentUpvoted: events.CommentUpvoted,
};

export function NotificationsPolicy(): Policy<typeof notificationInputs> {
  return {
    inputs: notificationInputs,
    body: {
      SnapshotProposalCreated: async (event) => {
        await processSnapshotProposalCreated(event);
      },
      ChainEventCreated: async (event) => {
        await processChainEventCreated(event);
      },
      ThreadCreated: async (event) => {
        await processThreadCreated(event);
      },
      CommentCreated: async (event) => {
        await processCommentCreated(event);
      },
      UserMentioned: async (event) => {
        await processUserMentioned(event);
      },
      ThreadUpvoted: async (event) => {
        await processThreadUpvoted(event);
      },
      CommentUpvoted: async (event) => {
        await processCommentUpvoted(event);
      },
    },
  };
}
