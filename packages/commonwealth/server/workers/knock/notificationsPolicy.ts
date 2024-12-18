import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { processChainEventCreated } from './eventHandlers/chainEventCreated';
import { processCommentCreated } from './eventHandlers/commentCreated';
import { processCommentUpvoted } from './eventHandlers/commentUpvoted';
import { processSnapshotProposalCreated } from './eventHandlers/snapshotProposalCreated';
import { processThreadCreated } from './eventHandlers/threadCreated';
import { processThreadUpvoted } from './eventHandlers/threadUpvoted';
import { processUserMentioned } from './eventHandlers/userMentioned';

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
      // eslint-disable-next-line @typescript-eslint/require-await
      SnapshotProposalCreated: async (event) => {
        await processSnapshotProposalCreated(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      ChainEventCreated: async (event) => {
        await processChainEventCreated(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      ThreadCreated: async (event) => {
        await processThreadCreated(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      CommentCreated: async (event) => {
        await processCommentCreated(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      UserMentioned: async (event) => {
        await processUserMentioned(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      ThreadUpvoted: async (event) => {
        await processThreadUpvoted(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      CommentUpvoted: async (event) => {
        await processCommentUpvoted(event);
      },
    },
  };
}
