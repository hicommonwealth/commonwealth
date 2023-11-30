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
import {
  rawAaveAbi,
  rawDydxAbi,
} from '../../../server/workers/evmChainEvents/hardCodedAbis';
import { hashAbi } from '../../../server/util/abiValidation';

export const testChainId = 'aave-test';
export const testChainIdV2 = 'dydx-test';
export const testAbiNickname = 'AaveGovernanceV2';
export const testAbiNicknameV2 = 'DydxGovernor';

export async function getTestChainNode(version?: 'v1' | 'v2') {
  let rpc: string, name: string;
  if (!version || version === 'v1') {
    rpc = localRpc;
    name = 'Test Node';
  } else {
    rpc = 'http://localhost:8546';
    name = 'Test Node 2';
  }

  const [chainNode, created] = await models.ChainNode.findOrCreate({
    where: {
      url: rpc,
      balance_type: BalanceType.Ethereum,
    },
    defaults: {
      name,
    },
  });

  return chainNode;
}

export async function getTestChain(version?: 'v1' | 'v2') {
  const chainNode = await getTestChainNode(version);

  let chainId: string, name: string, defaultSymbol: string;
  if (!version || version === 'v1') {
    chainId = testChainId;
    name = 'Aave Test';
    defaultSymbol = 'AAVE';
  } else {
    chainId = testChainIdV2;
    name = 'DyDx Test';
    defaultSymbol = 'DYDX';
  }

  const [chain, created] = await models.Community.findOrCreate({
    where: {
      id: chainId,
      chain_node_id: chainNode.id,
    },
    defaults: {
      name,
      network: ChainNetwork.Aave,
      type: ChainType.Chain,
      base: ChainBase.Ethereum,
      default_symbol: defaultSymbol,
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

export async function getTestAbi(version?: 'v1' | 'v2') {
  let hash: string, nickname: string;
  if (!version || version === 'v1') {
    hash = hashAbi(rawAaveAbi);
    nickname = testAbiNickname;
  } else {
    hash = hashAbi(rawDydxAbi);
    nickname = testAbiNicknameV2;
  }
  const existingAbi = await models.ContractAbi.findOne({
    where: {
      abi_hash: hash,
      nickname,
    },
  });

  if (existingAbi) return existingAbi;

  return await models.ContractAbi.create({
    abi: !version || version === 'v1' ? rawAaveAbi : rawDydxAbi,
    nickname: nickname,
    abi_hash: hash,
  });
}

export async function getTestContract(version?: 'v1' | 'v2') {
  const chainNode = await getTestChainNode(version);

  let address: string;
  if (!version || version === 'v1') {
    address = sdk.contractAddrs.aave.governance;
  } else {
    address = '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2';
  }

  const [contract, created] = await models.Contract.findOrCreate({
    where: {
      address,
      chain_node_id: chainNode.id,
    },
  });

  return contract;
}

export async function getTestCommunityContract(version?: 'v1' | 'v2') {
  const contract = await getTestContract(version);
  const chain = await getTestChain(version);

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

export async function getTestSubscription(version?: 'v1' | 'v2') {
  const chain = await getTestChain(version);
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

export async function getTestSignatures(version?: 'v1' | 'v2') {
  const chainNode = await getTestChainNode(version);

  let contractAddress: string;
  if (!version || version === 'v1') {
    contractAddress = sdk.contractAddrs.aave.governance;
  } else {
    contractAddress = '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2';
  }

  // signatures are the same for v1 and v2
  const [es1, es1Created] = await models.EvmEventSource.findOrCreate({
    where: {
      chain_node_id: chainNode.id,
      contract_address: contractAddress,
      event_signature: aavePropCreatedSignature,
      kind: 'proposal-created',
    },
  });

  const [es2, es2Created] = await models.EvmEventSource.findOrCreate({
    where: {
      chain_node_id: chainNode.id,
      contract_address: contractAddress,
      event_signature: aavePropQueuedSignature,
      kind: 'proposal-queued',
    },
  });

  return [es1, es2];
}
