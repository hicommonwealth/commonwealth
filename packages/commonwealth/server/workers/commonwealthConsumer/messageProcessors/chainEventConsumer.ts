import { PinoLogger } from '@hicommonwealth/adapters';
import {
  EventHandler,
  NotificationCategories,
  NotificationDataAndCategory,
  SupportedNetwork,
  commonProtocol,
  logger,
  schemas,
} from '@hicommonwealth/core';
import { CommunityAttributes, models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import Web3 from 'web3';
import { ZodUndefined, z } from 'zod';
import emitNotifications from '../../../util/emitNotifications';

const log = logger(PinoLogger()).getLogger(__filename);

const genericWeb3 = new Web3();

const communityStakeContractAddresses = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.communityStake);
const namespaceFactoryContractAddresses = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.factory);

function handleDeployedNamespace(
  event: z.infer<typeof schemas.events.ChainEventCreated>,
) {
  log.info('Implementation not defined', undefined, { event });
}

async function handleCommunityStakeTrades(
  event: z.infer<typeof schemas.events.ChainEventCreated>,
) {
  const existingTxn = await models.StakeTransaction.findOne({
    where: {
      transaction_hash: event.rawLog.transactionHash,
    },
  });
  if (existingTxn) return;

  const community = await models.Community.findOne({
    where: {
      namespace_address: event.parsedArgs.namespace,
    },
  });
  if (!community) {
    // Could also be a warning if namespace was created outside of CW
    log.error('Namespace could not be resolved to a community!', undefined, {
      event,
    });
    return;
  }

  const chainNode = await models.ChainNode.findOne({
    where: {
      id: event.eventSource.chainNodeId,
    },
  });
  if (!chainNode) {
    log.error('ChainNode associated to chain event not found!', undefined, {
      event,
    });
    return;
  }

  if (community.chain_node_id != chainNode.id) {
    log.error(
      "Event chain node and namespace chain node don't match",
      undefined,
      {
        event,
      },
    );
    return;
  }

  const web3 = new Web3(chainNode.private_url || chainNode.url);

  const [tradeTxReceipt, block] = await Promise.all([
    web3.eth.getTransactionReceipt(event.rawLog.transactionHash),
    web3.eth.getBlock(event.rawLog.blockHash),
  ]);

  const { 0: stakeId, 1: stakeAmount } = web3.eth.abi.decodeParameters(
    ['uint256', 'uint256'],
    tradeTxReceipt.logs[0].data,
  );

  await models.StakeTransaction.create({
    transaction_hash: event.rawLog.transactionHash,
    community_id: community.id,
    stake_id: parseInt(stakeId),
    stake_amount: parseInt(stakeAmount),
    stake_price: event.parsedArgs.ethAmount,
    address: event.parsedArgs.trader,
    stake_direction: event.parsedArgs.isBuy ? 'buy' : 'sell',
    timestamp: block.timestamp as number,
  });
}

async function handleProposalEvents(
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
        contractAddress: genericWeb3.utils.toChecksumAddress(
          event.rawLog.address,
        ),
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
          id: event.parsedArgs[0].toString(),
        },
      },
    };

    await emitNotifications(models, notification);
  } catch (e) {
    log.error('Failed to emit chain-event notification', e, { event });
  }
}

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  const contractAddress = genericWeb3.utils.toChecksumAddress(
    payload.rawLog.address,
  );
  if (communityStakeContractAddresses.includes(contractAddress)) {
    await handleCommunityStakeTrades(payload);
  } else if (namespaceFactoryContractAddresses.includes(contractAddress)) {
    handleDeployedNamespace(payload);
  } else if (payload.eventSource.kind.includes('proposal')) {
    await handleProposalEvents(payload);
  } else {
    log.error('Attempted to process an unsupported chain-event', undefined, {
      event: payload,
    });
  }
};
