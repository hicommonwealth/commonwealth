import { Policy, events, logger } from '@hicommonwealth/core';
import { processChainEventCreated } from './eventHandlers/chainEventCreated';
import { processCommentCreated } from './eventHandlers/commentCreated';
import { processSnapshotProposalCreated } from './eventHandlers/snapshotProposalCreated';
import { processSubscriptionPreferencesUpdated } from './eventHandlers/subscriptionPreferencesUpdated';
import { processUserMentioned } from './eventHandlers/userMentioned';

const log = logger(import.meta);

const notificationInputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
  ChainEventCreated: events.ChainEventCreated,
  ThreadCreated: events.ThreadCreated,
  CommentCreated: events.CommentCreated,
  UserMentioned: events.UserMentioned,
  SubscriptionPreferencesUpdated: events.SubscriptionPreferencesUpdated,
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
      // eslint-disable-next-line @typescript-eslint/require-await
      SubscriptionPreferencesUpdated: async (event) => {
        await processSubscriptionPreferencesUpdated(event);
      },
    },
  };
}
