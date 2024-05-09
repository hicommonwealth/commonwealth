import {
  EventHandler,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { getSnapshotUrl, SnapshotEventType } from '@hicommonwealth/shared';
import { fileURLToPath } from 'node:url';
import { QueryTypes } from 'sequelize';
import z from 'zod';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const output = z.boolean();

export const processSnapshotProposalCreated: EventHandler<
  'SnapshotProposalCreated',
  typeof output
> = async ({ payload }) => {
  log.info(`Processing snapshot message`, payload);

  const { space, id, event } = payload;

  if (!event || event !== SnapshotEventType.Created) {
    log.warn(
      'Unsupported Snapshot proposal event. No notification will be emitted',
      { event },
    );
    return false;
  }

  // Sometimes snapshot-listener will receive a webhook event from a
  // proposal that no longer exists. In that event, we will receive null data
  // from the listener. We can't do anything with that data, so we skip it.
  if (!space || !id) {
    log.info('Event received with invalid proposal, skipping');
    return false;
  }

  const communityAlerts = await models.sequelize.query<{
    community_id: string;
    community_name: string;
    users: { id: string }[];
  }>(
    `
        SELECT C.id                                                      as community_id,
               C.name                                                    as community_name,
               array_agg(JSON_BUILD_OBJECT('user_id', CA.user_id::TEXT)) as users
        FROM "Communities" C
                 JOIN "CommunityAlerts" CA ON C.id = CA.community_id
        WHERE :snapshotSpace = ANY (C.snapshot_spaces)
        GROUP BY C.id, C.name;
    `,
    {
      raw: true,
      type: QueryTypes.SELECT,
      replacements: {
        snapshotSpace: space,
      },
    },
  );

  for (const { community_id, community_name, users } of communityAlerts) {
    if (users.length) {
      const provider = notificationsProvider();
      // TODO: retries + error handling
      return await provider.triggerWorkflow({
        key: WorkflowKeys.SnapshotProposals,
        users,
        data: {
          community_name,
          space_name: space,
          snapshot_proposal_url: getSnapshotUrl(community_id, space, id),
        },
      });
    }
  }

  return true;
};
