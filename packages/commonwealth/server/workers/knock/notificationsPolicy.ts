import { Policy, schemas } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const notificationInputs = {
  SnapshotProposalCreated: schemas.events.SnapshotProposalCreated,
  ChainEventCreated: schemas.events.ChainEventCreated,
  ThreadCreated: schemas.events.ThreadCreated,
  CommentCreated: schemas.events.CommentCreated,
  UserMentioned: schemas.events.UserMentioned,
};

export const NotificationsPolicy: Policy<typeof notificationInputs> = () => ({
  inputs: notificationInputs,
  body: {
    // eslint-disable-next-line @typescript-eslint/require-await
    SnapshotProposalCreated: async () => {
      log.info('Method not implemented');
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    ChainEventCreated: async () => {
      log.info('Method not implemented');
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    ThreadCreated: async () => {
      log.info('Method not implemented');
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    CommentCreated: async () => {
      log.info('Method not implemented');
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    UserMentioned: async () => {
      log.info('Method not implemented');
    },
  },
});
