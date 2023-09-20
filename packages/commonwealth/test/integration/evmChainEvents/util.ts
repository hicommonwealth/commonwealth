import models from '../../../server/database';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';
import {
  aavePropCreatedSignature,
  aavePropQueuedSignature,
  localRpc,
  sdk,
} from '../../devnet/evm/evmChainEvents/util';
import { rawAaveAbi } from '../../../server/workers/evmChainEvents/hardCodedAbis';
import { hashAbi } from '../../../server/util/abiValidation';

export const testChainId = 'aave-test';
export const testAbiNickname = 'Aave Test Governance V2';

export async function getTestChainNode() {
  const [chainNode, created] = await models.ChainNode.findOrCreate({
    where: {
      url: localRpc,
      balance_type: BalanceType.Ethereum,
    },
    defaults: {
      name: 'Test Node',
    },
  });

  return chainNode;
}

export async function getTestChain() {
  const chainNode = await getTestChainNode();

  const [chain, created] = await models.Chain.findOrCreate({
    where: {
      id: testChainId,
      chain_node_id: chainNode.id,
    },
    defaults: {
      name: 'Aave Test',
      network: ChainNetwork.Aave,
      type: ChainType.Chain,
      base: ChainBase.Ethereum,
      default_symbol: 'AAVE',
    },
  });

  if (
    (!created && chain.network !== ChainNetwork.Aave) ||
    chain.type !== ChainType.Chain ||
    chain.base !== ChainBase.Ethereum
  ) {
    await chain.update({
      network: ChainNetwork.Aave,
      type: ChainType.Chain,
      base: ChainBase.Ethereum,
    });
  }

  return chain;
}

export async function getTestAbi() {
  const existingAbi = await models.ContractAbi.findOne({
    where: {
      abi_hash: hashAbi(rawAaveAbi),
      nickname: testAbiNickname,
    },
  });

  if (existingAbi) return existingAbi;

  return await models.ContractAbi.create({
    abi: rawAaveAbi,
    nickname: testAbiNickname,
    abi_hash: hashAbi(rawAaveAbi),
  });
}

export async function getTestContract() {
  const chainNode = await getTestChainNode();

  const [contract, created] = await models.Contract.findOrCreate({
    where: {
      address: sdk.contractAddrs.aave.governance,
      chain_node_id: chainNode.id,
    },
  });

  return contract;
}

export async function getTestCommunityContract() {
  const contract = await getTestContract();
  const chain = await getTestChain();

  const [communityContract, created] =
    await models.CommunityContract.findOrCreate({
      where: {
        chain_id: chain.id,
        contract_id: contract.id,
      },
    });

  communityContract.Contract = contract;
  return communityContract;
}

export async function getTestUser() {
  const [user, created] = await models.User.findOrCreate({
    where: {
      email: 'test@gmail.com',
    },
  });

  return user;
}

export async function getTestSubscription() {
  const chain = await getTestChain();
  const user = await getTestUser();

  const [sub, created] = await models.Subscription.findOrCreate({
    where: {
      subscriber_id: user.id,
      category_id: 'chain-event',

      chain_id: chain.id,
    },
    defaults: {
      is_active: true,
      immediate_email: false,
    },
  });

  if (!created && (!sub.is_active || sub.immediate_email)) {
    await sub.update({ is_active: true, immediate_email: false });
  }

  return sub;
}

export async function getTestSignatures() {
  const chainNode = await getTestChainNode();

  const [es1, es1Created] = await models.EvmEventSource.findOrCreate({
    where: {
      chain_node_id: chainNode.id,
      contract_address: sdk.contractAddrs.aave.governance,
      event_signature: aavePropCreatedSignature,
      kind: 'proposal-created',
    },
  });

  const [es2, es2Created] = await models.EvmEventSource.findOrCreate({
    where: {
      chain_node_id: chainNode.id,
      contract_address: sdk.contractAddrs.aave.governance,
      event_signature: aavePropQueuedSignature,
      kind: 'proposal-queued',
    },
  });

  return [es1, es2];
}
