import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { SnapshotEventType } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { getSnapshotUrl } from '../util';

const log = logger(import.meta);

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
    custom_domain: string | null;
    users: { id: string }[];
  }>(
    `
        SELECT C.id                                                      as community_id,
               C.name                                                    as community_name,
               C.custom_domain                                           as custom_domain,
               array_agg(JSON_BUILD_OBJECT('id', CA.user_id::TEXT)) as users
        FROM "Communities" C
                 JOIN "CommunityAlerts" CA ON C.id = CA.community_id
        WHERE :snapshotSpace = ANY (C.snapshot_spaces)
        GROUP BY C.id, C.name, C.custom_domain;
    `,
    {
      raw: true,
      type: QueryTypes.SELECT,
      replacements: {
        snapshotSpace: space,
      },
    },
  );

  let returnValue = true;
  for (const {
    community_id,
    community_name,
    users,
    custom_domain,
  } of communityAlerts) {
    if (users.length) {
      const provider = notificationsProvider();
      const res = await provider.triggerWorkflow({
        key: WorkflowKeys.SnapshotProposals,
        users,
        data: {
          community_id,
          community_name,
          space_name: space,
          snapshot_proposal_url: getSnapshotUrl(
            community_id,
            space,
            id,
            custom_domain,
          ),
        },
      });
      returnValue = !res.some((r) => r.status === 'rejected');
    }
  }

  return returnValue;
};
