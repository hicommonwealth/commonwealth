import { schemas } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { CommunityAttributes, DB } from '@hicommonwealth/model';
import {
  NotificationCategories,
  NotificationDataAndCategory,
  SupportedNetwork,
} from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import { z } from 'zod';
import emitNotifications from '../../../../util/emitNotifications';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
const web3 = new Web3();

export async function handleGovernanceProposalEvents(
  models: DB,
  event: z.infer<typeof schemas.events.ChainEventCreated>,
) {
  const community: {
    id: CommunityAttributes['id'];
    network: CommunityAttributes['network'];
  }[] = await models.sequelize.query(
    `
    SELECT CH.id, CH.network
    FROM "Contracts" C
             JOIN "CommunityContracts" CC on C.id = CC.contract_id
             JOIN "Communities" CH ON CC.community_id = CH.id
    WHERE C.address = :contractAddress AND C.chain_node_id = :chainNodeId
    LIMIT 1;
  `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        contractAddress: web3.utils.toChecksumAddress(event.rawLog.address),
        chainNodeId: event.eventSource.chainNodeId,
      },
    },
  );

  if (community.length === 0) {
    log.error(
      'No associated community found! Consider deactivating the event source',
      undefined,
      { event },
    );
    return;
  }

  try {
    const notification: NotificationDataAndCategory = {
      categoryId: NotificationCategories.ChainEvent,
      data: {
        community_id: community[0].id,
        network: community[0].network as unknown as SupportedNetwork,
        block_number: event.rawLog.blockNumber,
        event_data: {
          kind: event.eventSource.kind,
          id: BigNumber.from(event.parsedArgs[0]).toString(),
        },
      },
    };

    await emitNotifications(models, notification);
  } catch (e) {
    log.error('Failed to emit chain-event notification', e, { event });
  }
}
