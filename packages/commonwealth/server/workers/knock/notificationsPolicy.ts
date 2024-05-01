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
    SnapshotProposalCreated: async () => {
      log.info('Method not implemented');
    },
    ChainEventCreated: async () => {
      log.info('Method not implemented');
    },
    ThreadCreated: async () => {
      log.info('Method not implemented');
    },
    CommentCreated: async () => {
      log.info('Method not implemented');
    },
    UserMentioned: async () => {
      log.info('Method not implemented');
    },
  },
});
