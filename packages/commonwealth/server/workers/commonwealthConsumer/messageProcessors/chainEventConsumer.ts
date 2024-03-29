import { PinoLogger } from '@hicommonwealth/adapters';
import {
  EventHandler,
  commonProtocol,
  logger,
  schemas,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import Web3 from 'web3';
import { ZodUndefined, z } from 'zod';

const log = logger(PinoLogger()).getLogger(__filename);

const communityStakeContractAddresses = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.communityStake.toLowerCase());
const namespaceFactoryContractAddresses = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.namespaceFactory.toLowerCase());

async function handleDeployedNamespace(
  event: z.infer<typeof schemas.events.ChainEventCreated>,
) {
  console.log('Do nothing');
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
    timestamp: block.timestamp,
  });
}

async function handleProposalEvents(
  event: z.infer<typeof schemas.events.ChainEventCreated>,
) {}

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  const contractAddress = payload.rawLog.address.toLowerCase();
  if (communityStakeContractAddresses.includes(contractAddress)) {
    await handleCommunityStakeTrades(payload);
  } else if (namespaceFactoryContractAddresses.includes(contractAddress)) {
    await handleDeployedNamespace(payload);
  } else {
    await handleProposalEvents(payload);
  }
};
