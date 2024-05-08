import { EventHandler, Policy, events } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import {
  ISnapshotNotificationData,
  NotificationCategories,
  SnapshotEventType,
} from '@hicommonwealth/shared';
import { fileURLToPath } from 'node:url';
import { Op } from 'sequelize';
import { ZodUndefined } from 'zod';
import emitNotifications from '../../../util/emitNotifications';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const processSnapshotProposalCreated: EventHandler<
  'SnapshotProposalCreated',
  ZodUndefined
> = async ({ payload }) => {
  const { space, id, title, body, choices, start, expire, event } = payload;

  // Sometimes snapshot-listener will receive a webhook event from a
  // proposal that no longer exists. In that event, we will receive null data
  // from the listener. We can't do anything with that data, so we skip it.
  if (!space && event !== SnapshotEventType.Deleted) {
    log.info('Event received with invalid proposal, skipping');
    return;
  }

  const snapshotNotificationData: ISnapshotNotificationData = {
    space,
    id,
    title,
    body,
    choices,
    start: String(start),
    expire: String(expire),
    eventType: event as SnapshotEventType,
  };

  log.info(`Processing snapshot message`, payload);

  const associatedCommunities = await models.Community.findAll({
    where: {
      snapshot_spaces: {
        [Op.contains]: [space],
      },
    },
  });

  log.info(
    `Found ${associatedCommunities.length} associated communities for snapshot space ${space} `,
  );

  if (associatedCommunities.length > 0) {
    // Notifications
    emitNotifications(models, {
      categoryId: NotificationCategories.SnapshotProposal,
      data: snapshotNotificationData,
    }).catch((err) => {
      log.error('Error sending snapshot notification', err);
    });
  }
};

const snapshotInputs = {
  SnapshotProposalCreated: events.SnapshotProposalCreated,
};
export function SnapshotPolicy(): Policy<typeof snapshotInputs, ZodUndefined> {
  return {
    inputs: snapshotInputs,
    body: {
      SnapshotProposalCreated: processSnapshotProposalCreated,
    },
  };
}
