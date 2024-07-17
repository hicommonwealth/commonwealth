import {
  events,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { getCommunityUrl } from '../../../../../shared/utils';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export async function handleCommunityStakeTrades(
  models: DB,
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const { 1: namespaceAddress, 2: isBuy } = event.parsedArgs as z.infer<
    typeof events.CommunityStakeTrade
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
        SELECT DISTINCT(user_id)::TEXT as id
        FROM "Addresses"
        WHERE community_id = :communityId
          AND role = 'admin';
    `,
    {
      raw: true,
      type: QueryTypes.SELECT,
      replacements: {
        communityId: community.id,
      },
    },
  );

  console.log(users);

  if (users.length) {
    const provider = notificationsProvider();
    return await provider.triggerWorkflow({
      key: WorkflowKeys.CommunityStake,
      users,
      data: {
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
        transaction_type: isBuy ? 'minted' : 'burned',
        community_name: community.name,
        // @ts-expect-error StrictNullChecks
        community_stakes_url: getCommunityUrl(community.id),
      },
    });
  }

  return true;
}
