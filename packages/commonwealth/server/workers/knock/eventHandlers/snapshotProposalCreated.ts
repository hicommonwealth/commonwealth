import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import {
  ISnapshotNotificationData,
  NotificationCategories,
  SnapshotEventType,
} from '@hicommonwealth/shared';
import { fileURLToPath } from 'node:url';
import { Op } from 'sequelize';
import z from 'zod';
import emitNotifications from '../../../util/emitNotifications';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const output = z.boolean();

export const processSnapshotProposalCreated: EventHandler<
  'SnapshotProposalCreated',
  typeof output
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

  const users = (await models.CommunityAlert.findAll({
    where: {
      community_id: {
        [Op.in]: associatedCommunities.map((c) => c.id),
      },
    },
    attributes: ['community_id', 'user_id'],
    raw: true,
  })) as { user_id: number }[];

  if (associatedCommunities.length > 0) {
    const provider = notificationsProvider();
    return await provider.triggerWorkflow({
      key: WorkflowKeys.SnapshotProposals,
      users: users.map((u) => ({ id: String(u.user_id) })),
      data: {
        space_name: space,
        snapshot_proposal_url: '',
      },
    });

    // Notifications
    emitNotifications(models, {
      categoryId: NotificationCategories.SnapshotProposal,
      data: snapshotNotificationData,
    }).catch((err) => {
      log.error('Error sending snapshot notification', err);
    });
  }
};
