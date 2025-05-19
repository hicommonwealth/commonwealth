import { InvalidState } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  BalanceSourceType,
  NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID,
  ZERO_ADDRESS,
} from '@hicommonwealth/shared';
import { GetBalancesOptions, tokenBalanceCache } from '.';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { contractHelpers } from '../services/commonProtocol';

/**
 * Calculates voting weight of address based on the topic in wei
 * @param topic_id topic id
 * @param address user's address
 * @returns voting weight or null if no stake if found
 */
export async function getVotingWeight(
  topic_id: number,
  address: string,
): Promise<bigint | null> {
  const topic = await models.Topic.findByPk(topic_id, {
    include: [
      {
        model: models.Community,
        as: 'community',
        required: true,
        include: [
          {
            model: models.ChainNode.scope('withPrivateData'),
            required: false,
          },
          {
            model: models.CommunityStake,
            required: false,
          },
        ],
      },
      {
        model: models.ChainNode.scope('withPrivateData'),
        required: false,
      },
    ],
  });
  mustExist('Topic', topic);

  const { community } = topic;
  mustExist('Community', community);

  const namespaceChainNode = community.ChainNode;

  if (topic.weighted_voting === TopicWeightedVoting.Stake) {
    mustExist('Chain Node Eth Chain Id', namespaceChainNode?.eth_chain_id);
    mustExist('Community Namespace Address', community.namespace_address);

    const stake = topic.community?.CommunityStakes?.at(0);
    mustExist('Community Stake', stake);

    const stakeBalances = await contractHelpers.getNamespaceBalance(
      community.namespace_address,
      stake.stake_id,
      namespaceChainNode.eth_chain_id,
      [address],
    );
    const stakeBalance = stakeBalances[address];
    if (BigInt(stakeBalance) === BigInt(0)) {
      throw new InvalidState('Must have stake to vote');
    }

    return commonProtocol.calculateVoteWeight(stakeBalance, stake.vote_weight);
  } else if (topic.weighted_voting === TopicWeightedVoting.ERC20) {
    // if topic chain node is missing, fallback on community chain node
    const chainNode = topic.ChainNode || community.ChainNode!;
    const { eth_chain_id } = chainNode;
    mustExist('Chain Node Eth Chain Id', eth_chain_id);
    mustExist('Topic Token Address', topic.token_address);

    const numTokens = await getWeightedNumTokens(
      address,
      topic.token_address,
      eth_chain_id,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient token balance');
    }
  } else if (topic.weighted_voting === TopicWeightedVoting.SPL) {
    // SPL Token support
    mustExist('Topic Token Address', topic.token_address);
    const chainNode = topic.ChainNode || community.ChainNode!;
    mustExist('Chain Node', chainNode);
    mustExist('Chain Node Name', chainNode.name);

    const numTokens = await getWeightedSPLTokens(
      address,
      topic.token_address,
      chainNode.name!,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient SPL token balance');
    }
    return numTokens;
  } else if (topic.weighted_voting === TopicWeightedVoting.SuiNative) {
    // Sui Native token support
    const chainNode = topic.ChainNode || community.ChainNode!;
    mustExist('Chain Node', chainNode);
    mustExist('Chain Node Balance Type', chainNode.balance_type);
    mustExist('Chain Node ID', chainNode.id);

    const numTokens = await getWeightedSuiNativeTokens(
      address,
      chainNode.id!,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient Sui Native token balance');
    }
    return numTokens;
  } else if (topic.weighted_voting === TopicWeightedVoting.SuiToken) {
    // Sui Token support
    const chainNode = topic.ChainNode || community.ChainNode!;
    mustExist('Chain Node', chainNode);
    mustExist('Topic Token Address', topic.token_address);
    mustExist('Chain Node Balance Type', chainNode.balance_type);
    mustExist('Chain Node ID', chainNode.id);

    const numTokens = await getWeightedSuiTokens(
      address,
      topic.token_address!,
      chainNode.id!,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient Sui token balance');
    }
    return numTokens;
  } else if (topic.weighted_voting === TopicWeightedVoting.SPL) {
    // SPL Token support
    mustExist('Topic Token Address', topic.token_address);
    const chainNode = topic.ChainNode || community.ChainNode!;
    mustExist('Chain Node', chainNode);
    mustExist('Chain Node Name', chainNode.name);

    const numTokens = await getWeightedSPLTokens(
      address,
      topic.token_address,
      chainNode.name!,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient SPL token balance');
    }
    return numTokens;
  } else if (topic.weighted_voting === TopicWeightedVoting.SuiNative) {
    // Sui Native token support
    const chainNode = topic.ChainNode || community.ChainNode!;
    mustExist('Chain Node', chainNode);
    mustExist('Chain Node Balance Type', chainNode.balance_type);
    mustExist('Chain Node ID', chainNode.id);

    const numTokens = await getWeightedSuiNativeTokens(
      address,
      chainNode.id!,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient Sui Native token balance');
    }
    return numTokens;
  } else if (topic.weighted_voting === TopicWeightedVoting.SuiToken) {
    // Sui Token support
    const chainNode = topic.ChainNode || community.ChainNode!;
    mustExist('Chain Node', chainNode);
    mustExist('Topic Token Address', topic.token_address);
    mustExist('Chain Node Balance Type', chainNode.balance_type);
    mustExist('Chain Node ID', chainNode.id);

    const numTokens = await getWeightedSuiTokens(
      address,
      topic.token_address!,
      chainNode.id!,
      topic.vote_weight_multiplier!,
    );
    if (numTokens === BigInt(0)) {
      throw new InvalidState('Insufficient Sui token balance');
    }
    return numTokens;
  } else if (topic.weighted_voting === TopicWeightedVoting.ERC1155ID) {
    // similar to stake voting, but for community nomination token on namespace
    mustExist('Chain Node Eth Chain Id', namespaceChainNode?.eth_chain_id);
    mustExist('Community Namespace Address', community.namespace_address);

    const namespaceBalances = await contractHelpers.getNamespaceBalance(
      community.namespace_address,
      NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID,
      namespaceChainNode.eth_chain_id,
      [address],
    );
    const tokenBalance = namespaceBalances[address];
    if (BigInt(tokenBalance) === BigInt(0)) {
      throw new InvalidState('Must have community nomination token to vote');
    }

    return commonProtocol.calculateVoteWeight(tokenBalance, 1);
  }

  // no weighted voting
  return null;
}

export async function getWeightedNumTokens(
  address: string,
  tokenAddress: string,
  ethChainId: number,
  voteWeightMultiplier: number,
): Promise<bigint> {
  const balanceOptions: GetBalancesOptions =
    tokenAddress == ZERO_ADDRESS
      ? {
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [address],
          sourceOptions: {
            evmChainId: ethChainId,
          },
        }
      : {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [address],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: tokenAddress,
          },
        };

  balanceOptions.cacheRefresh = true;

  const balances = await tokenBalanceCache.getBalances(balanceOptions);

  const tokenBalance = balances[address];

  if (BigInt(tokenBalance || 0) <= BigInt(0)) {
    throw new InvalidState('Insufficient token balance');
  }
  const result = commonProtocol.calculateVoteWeight(
    tokenBalance,
    voteWeightMultiplier,
  );
  return result || BigInt(0);
}

export async function getWeightedSPLTokens(
  address: string,
  mintAddress: string,
  solanaNetworkName: string,
  voteWeightMultiplier: number,
): Promise<bigint> {
  const balanceOptions: GetBalancesOptions = {
    balanceSourceType: BalanceSourceType.SPL,
    addresses: [address],
    mintAddress,
    solanaNetwork: solanaNetworkName,
    cacheRefresh: true,
  };

  const balances = await tokenBalanceCache.getBalances(balanceOptions);
  const tokenBalance = balances[address];

  if (BigInt(tokenBalance || 0) <= BigInt(0)) {
    throw new InvalidState('Insufficient SPL token balance');
  }
  const result = commonProtocol.calculateVoteWeight(
    tokenBalance,
    voteWeightMultiplier,
  );
  return result || BigInt(0);
}

export async function getWeightedSuiNativeTokens(
  address: string,
  chainNodeId: number,
  voteWeightMultiplier: number,
): Promise<bigint> {
  // Get the chain node to determine the network
  const chainNode = await models.ChainNode.findByPk(chainNodeId);
  mustExist('Chain Node', chainNode);

  const balanceOptions: GetBalancesOptions = {
    balanceSourceType: BalanceSourceType.SuiNative,
    addresses: [address],
    sourceOptions: {
      // Use the network from the chain node's identifier for the network
      suiNetwork: chainNode.name,
    },
    cacheRefresh: true,
  };

  const balances = await tokenBalanceCache.getBalances(balanceOptions);
  const tokenBalance = balances[address];

  if (BigInt(tokenBalance || 0) <= BigInt(0)) {
    throw new InvalidState('Insufficient Sui Native token balance');
  }
  const result = commonProtocol.calculateVoteWeight(
    tokenBalance,
    voteWeightMultiplier,
  );
  return result || BigInt(0);
}

export async function getWeightedSuiTokens(
  address: string,
  tokenAddress: string,
  chainNodeId: number,
  voteWeightMultiplier: number,
): Promise<bigint> {
  // Get the chain node to determine the network
  const chainNode = await models.ChainNode.findByPk(chainNodeId);
  mustExist('Chain Node', chainNode);

  const balanceOptions: GetBalancesOptions = {
    balanceSourceType: BalanceSourceType.SuiToken,
    addresses: [address],
    sourceOptions: {
      // Use the network from the chain node's identifier for the network
      suiNetwork: chainNode.name,
      coinType: tokenAddress,
    },
    cacheRefresh: true,
  };

  const balances = await tokenBalanceCache.getBalances(balanceOptions);
  const tokenBalance = balances[address];

  if (BigInt(tokenBalance || 0) <= BigInt(0)) {
    throw new InvalidState('Insufficient Sui token balance');
  }
  const result = commonProtocol.calculateVoteWeight(
    tokenBalance,
    voteWeightMultiplier,
  );
  return result || BigInt(0);
}
