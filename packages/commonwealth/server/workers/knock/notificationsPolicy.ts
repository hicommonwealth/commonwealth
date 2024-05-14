import { Policy, events } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'url';
import { processChainEventCreated } from './eventHandlers/chainEventCreated';
import { processCommentCreated } from './eventHandlers/commentCreated';
import { processSnapshotProposalCreated } from './eventHandlers/snapshotProposalCreated';
import { processUserMentioned } from './eventHandlers/userMentioned';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const notificationInputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
  ChainEventCreated: events.ChainEventCreated,
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
  UserMentioned: events.UserMentioned,
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
      ThreadCreated: async () => {
        log.info('Method not implemented');
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      CommentCreated: async (event) => {
        await processCommentCreated(event);
      },
      // eslint-disable-next-line @typescript-eslint/require-await
      UserMentioned: async (event) => {
        await processUserMentioned(event);
      },
    },
  };
}
