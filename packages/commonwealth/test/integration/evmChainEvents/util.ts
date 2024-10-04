import {
  communityStakesAbi,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-testing';
import { hashAbi, models } from '@hicommonwealth/model';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  commonProtocol,
} from '@hicommonwealth/shared';
import {
  rawCompoundAbi,
  rawDydxAbi,
} from '../../../server/workers/evmChainEvents/hardCodedAbis';
import {
  compoundPropCreatedSignature,
  compoundPropQueuedSignature,
  localRpc,
} from '../../devnet/evm/evmChainEvents/util';

export const testChainId = 'compound-test';
export const testChainIdV2 = 'dydx-test';
export const testAbiNickname = 'NamespaceFactory';
export const testAbiNicknameV2 = 'CommunityStakes';

export async function getTestChainNode(version?: 'v1' | 'v2') {
  let url = localRpc;
  let name = 'Local Base Sepolia';
  let eth_chain_id = commonProtocol.ValidChains.SepoliaBase;

  if (version === 'v2') {
    url = 'http://localhost:8546';
    name = 'Local Ethereum Sepolia';
    eth_chain_id = commonProtocol.ValidChains.Sepolia;
  }

  const chainNode = await models.ChainNode.findOne({
    where: {
      eth_chain_id: eth_chain_id,
    },
  });

  if (chainNode) {
    chainNode.url = url;
    chainNode.name = name;
    chainNode.balance_type = BalanceType.Ethereum;
    await chainNode.save();
    return chainNode;
  }

  return await models.ChainNode.create({
    url,
    balance_type: BalanceType.Ethereum,
    name,
    eth_chain_id,
  });
}

export async function getTestCommunity(version?: 'v1' | 'v2') {
  const chainNode = await getTestChainNode(version);

  let chainId: string, name: string, defaultSymbol: string;
  if (!version || version === 'v1') {
    chainId = testChainId;
    name = 'Compound Test';
    defaultSymbol = 'COW';
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
    // @ts-expect-error StrictNullChecks
    defaults: {
      name,
      network: ChainNetwork.Compound,
      type: ChainType.Chain,
      base: ChainBase.Ethereum,
      default_symbol: defaultSymbol,
    },
  });

  if (
    (!created && chain.network !== ChainNetwork.Compound) ||
    chain.type !== ChainType.Chain ||
    chain.base !== ChainBase.Ethereum
  ) {
    await chain.update({
      network: ChainNetwork.Compound,
      type: ChainType.Chain,
      base: ChainBase.Ethereum,
    });
  }

  return chain;
}

export async function getTestAbi(version?: 'v1' | 'v2') {
  let hash: string, nickname: string;
  if (!version || version === 'v1') {
    hash = hashAbi(namespaceFactoryAbi);
    nickname = testAbiNickname;
  } else {
    hash = hashAbi(communityStakesAbi);
    nickname = testAbiNicknameV2;
  }
  const existingAbi = await models.ContractAbi.findOne({
    where: {
      abi_hash: hash,
      nickname,
    },
  });

  if (existingAbi) return existingAbi;

  // @ts-expect-error StrictNullChecks
  return await models.ContractAbi.create({
    abi: !version || version === 'v1' ? rawCompoundAbi : rawDydxAbi,
    nickname: nickname,
    abi_hash: hash,
  });
}

export async function getTestContract(version?: 'v1' | 'v2') {
  const chainNode = await getTestChainNode(version);

  let address: string;
  if (!version || version === 'v1') {
    address = commonProtocol.factoryContracts[chainNode.eth_chain_id!].factory;
  } else {
    address =
      commonProtocol.factoryContracts[chainNode.eth_chain_id!].communityStake;
  }

  const [contract] = await models.Contract.findOrCreate({
    where: {
      address,
      chain_node_id: chainNode.id!,
      type: 'erc20',
    },
  });

  return contract;
}

export async function getTestCommunityContract(version?: 'v1' | 'v2') {
  const contract = await getTestContract(version);
  const chain = await getTestCommunity(version);

  const [communityContract] = await models.CommunityContract.findOrCreate({
    where: {
      community_id: chain.id,
      contract_id: contract.id,
    },
  });

  communityContract.Contract = contract;
  return communityContract;
}

export async function getTestUser() {
  const [user] = await models.User.findOrCreate({
    where: {
      email: 'test@gmail.com',
      profile: {},
    },
  });

  return user;
}

export async function getTestSignatures(version?: 'v1' | 'v2') {
  const chainNode = await getTestChainNode(version);
  const abi = await getTestAbi(version);

  let contractAddress: string;
  if (!version || version === 'v1') {
    contractAddress =
      commonProtocol.factoryContracts[chainNode.eth_chain_id!].factory;
  } else {
    contractAddress =
      commonProtocol.factoryContracts[chainNode.eth_chain_id!].communityStake;
  }

  // signatures are the same for v1 and v2
  const [es1] = await models.EvmEventSource.findOrCreate({
    where: {
      chain_node_id: chainNode.id!,
      contract_address: contractAddress,
      event_signature: compoundPropCreatedSignature,
      kind: 'proposal-created',
      abi_id: abi.id,
    },
  });

  const [es2] = await models.EvmEventSource.findOrCreate({
    where: {
      chain_node_id: chainNode.id!,
      contract_address: contractAddress,
      event_signature: compoundPropQueuedSignature,
      kind: 'proposal-queued',
      abi_id: abi.id,
    },
  });

  return [es1, es2];
}
