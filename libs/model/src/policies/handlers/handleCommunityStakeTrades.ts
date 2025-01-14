import {
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { chainEvents, events } from '@hicommonwealth/schemas';
import { getCommunityUrl } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { DB } from '../../models';

const log = logger(import.meta);

export async function handleCommunityStakeTrades(
  models: DB,
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const { 1: namespaceAddress, 2: isBuy } = event.parsedArgs as z.infer<
    typeof chainEvents.CommunityStakeTrade
  >;

  const community = await models.Community.findOne({
    where: {
      namespace_address: namespaceAddress,
    },
  });

  if (!community) {
    // Could also be a warning if namespace was created outside of CW
    log.error('Namespace could not be resolved to a community!', undefined, {
      event,
    });
    return false;
  }

  const users = await models.sequelize.query<{ id: string }>(
    `
        SELECT DISTINCT(U.id)::TEXT as id
        FROM "Users" U
        JOIN "Addresses" A ON A.user_id = U.id
        WHERE A.community_id = :communityId AND (A.role = 'admin' OR U."isAdmin" = true);
    `,
    {
      raw: true,
      type: QueryTypes.SELECT,
      replacements: {
        communityId: community.id,
      },
    },
  );

  if (users.length) {
    const provider = notificationsProvider();
    const res = await provider.triggerWorkflow({
      key: WorkflowKeys.CommunityStake,
      users,
      data: {
        community_id: community.id,
        transaction_type: isBuy ? 'minted' : 'burned',
        community_name: community.name,
        community_stakes_url: getCommunityUrl(community.id),
      },
    });
    return !res.some((r) => r.status === 'rejected');
  }

  return true;
}
