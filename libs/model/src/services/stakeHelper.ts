import { InvalidState } from '@hicommonwealth/core';
import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { BalanceSourceType, commonProtocol } from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { tokenBalanceCache } from '.';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { contractHelpers } from '../services/commonProtocol';

/**
 * Calculates voting weight of address based on the topic
 * @param topic_id topic id
 * @param address user's address
 * @returns voting weight or null if no stake if found
 */
export async function getVotingWeight(
  topic_id: number,
  address: string,
): Promise<BigNumber | null> {
  if (config.STAKE.REACTION_WEIGHT_OVERRIDE)
    return BigNumber.from(config.STAKE.REACTION_WEIGHT_OVERRIDE);

  const topic = await models.Topic.findByPk(topic_id, {
    include: [
      {
        model: models.Community,
        as: 'community',
        required: true,
        include: [
          {
            model: models.ChainNode,
            required: false,
          },
          {
            model: models.CommunityStake,
            required: false,
          },
        ],
      },
    ],
  });
  mustExist('Topic', topic);

  const { community } = topic;
  mustExist('Community', community);

  const chain_node = community.ChainNode;

  if (topic.weighted_voting === TopicWeightedVoting.Stake) {
    mustExist('Chain Node Eth Chain Id', chain_node?.eth_chain_id);
    mustExist('Community Namespace Address', community.namespace_address);

    const stake = topic.community?.CommunityStakes?.at(0);
    mustExist('Community Stake', stake);

    const stakeBalances = await contractHelpers.getNamespaceBalance(
      community.namespace_address,
      stake.stake_id,
      chain_node.eth_chain_id,
      [address],
    );
    const stakeBalance = stakeBalances[address];
    if (BigNumber.from(stakeBalance).lte(0))
      throw new InvalidState('Must have stake to upvote');

    return commonProtocol.calculateVoteWeight(stakeBalance, stake.vote_weight);
  } else if (topic.weighted_voting === TopicWeightedVoting.ERC20) {
    mustExist('Chain Node Eth Chain Id', chain_node?.eth_chain_id);

    const balances = await tokenBalanceCache.getBalances({
      balanceSourceType: BalanceSourceType.ERC20,
      addresses: [address],
      sourceOptions: {
        evmChainId: chain_node.eth_chain_id,
        contractAddress: topic.token_address!,
      },
      cacheRefresh: true,
    });

    const tokenBalance = balances[address];

    if (BigNumber.from(tokenBalance).lte(0))
      throw new InvalidState('Insufficient token balance');

    const result = commonProtocol.calculateVoteWeight(
      tokenBalance,
      topic.vote_weight_multiplier!,
    );
    // only count full ERC20 tokens
    return result?.div(BigNumber.from(10).pow(18)) || null;
  }

  // no weighted voting
  return null;
}
