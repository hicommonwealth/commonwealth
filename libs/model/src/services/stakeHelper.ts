import { InvalidState } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { BalanceSourceType, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { GetBalancesOptions, tokenBalanceCache } from '.';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { contractHelpers } from '../services/commonProtocol';
import { getTokenAttributes } from './commonProtocol/contractHelpers';

/**
 * Calculates voting weight of address based on the topic
 * @param topic_id topic id
 * @param address user's address
 * @returns voting weight or null if no stake if found
 */
export async function getVotingWeight(
  topic_id: number,
  address: string,
): Promise<bigint | null> {
  if (config.STAKE.REACTION_WEIGHT_OVERRIDE)
    return BigInt(config.STAKE.REACTION_WEIGHT_OVERRIDE);

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
    const { eth_chain_id, private_url, url } = topic.ChainNode!;
    mustExist('Chain Node Eth Chain Id', eth_chain_id);
    const chainNodeUrl = private_url! || url!;
    mustExist('Chain Node URL', chainNodeUrl);
    mustExist('Topic Token Address', topic.token_address);

    const numFullTokens = await getWeightedNumTokens(
      address,
      topic.token_address,
      eth_chain_id,
      chainNodeUrl,
      topic.vote_weight_multiplier!,
    );
    if (numFullTokens === BigInt(0)) {
      // if the weighted value is not at least a full token, reject the action
      throw new InvalidState('Insufficient token balance');
    }
    return numFullTokens;
  }

  // no weighted voting
  return null;
}

export async function getWeightedNumTokens(
  address: string,
  tokenAddress: string,
  ethChainId: number,
  chainNodeUrl: string,
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
  const { decimals } = await getTokenAttributes(
    tokenAddress,
    chainNodeUrl,
    false,
  );
  // only count full ERC20 tokens
  const numFullTokens = result ? result / BigInt(10 ** decimals) : null;
  if (!numFullTokens || numFullTokens === BigInt(0)) {
    return BigInt(0);
  }
  return numFullTokens;
}
