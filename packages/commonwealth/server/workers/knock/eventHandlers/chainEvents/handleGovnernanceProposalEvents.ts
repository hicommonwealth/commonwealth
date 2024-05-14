import {
  events,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { CommunityAttributes, DB } from '@hicommonwealth/model';
import { ETHERS_BIG_NUMBER } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import Web3 from 'web3';
import { z } from 'zod';
import { getChainProposalUrl } from '../../util';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
const web3 = new Web3();

export async function handleGovernanceProposalEvents(
  models: DB,
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const community = await models.sequelize.query<{
    id: CommunityAttributes['id'];
    name: CommunityAttributes['name'];
  }>(
    `
        SELECT CH.id, CH.network
        FROM "Contracts" C
                 JOIN "CommunityContracts" CC on C.id = CC.contract_id
                 JOIN "Communities" CH ON CC.community_id = CH.id
        WHERE C.address = :contractAddress
          AND C.chain_node_id = :chainNodeId
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

  const users = await models.sequelize.query<{
    id: string;
  }>(
    `
        SELECT user_id::TEXT as id
        FROM "CommunityAlerts"
        WHERE community_id = :communityId;
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        communityId: community[0].id,
      },
    },
  );

  const provider = notificationsProvider();

  return await provider.triggerWorkflow({
    key: WorkflowKeys.ChainProposals,
    users,
    data: {
      community_name: community[0].name,
      proposal_kind: event.eventSource.kind as
        | 'proposal-created'
        | 'proposal-canceled'
        | 'proposal-executed'
        | 'proposal-queued',
      proposal_url: getChainProposalUrl(
        community[0].id,
        String(event.parsedArgs[0] as z.infer<typeof ETHERS_BIG_NUMBER>),
      ),
    },
  });
}
