import { InvalidState } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { BalanceSourceType, ZERO_ADDRESS } from '@hicommonwealth/shared';
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
      throw new InvalidState('Must have stake to upvote');
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
      // if the weighted value is not at least a full token, reject the action
      throw new InvalidState('Insufficient token balance');
    }
    return numTokens;
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
