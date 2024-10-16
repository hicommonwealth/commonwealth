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
): Promise<number | null> {
  if (config.STAKE.REACTION_WEIGHT_OVERRIDE)
    return config.STAKE.REACTION_WEIGHT_OVERRIDE;

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
      {
        model: models.ChainNode,
        required: false,
      },
    ],
  });

  mustExist('Topic', topic);

  const { community } = topic;
  mustExist('Community', community);

  const chain_node = community.ChainNode;
  mustExist('Chain Node Eth Chain Id', chain_node?.eth_chain_id);

  if (topic.weighted_voting === TopicWeightedVoting.Stake) {
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
    const { token_address, vote_weight_multiplier } = topic;
    mustExist('Topic Chain Node Eth Chain Id', chain_node?.eth_chain_id);

    const balances = await tokenBalanceCache.getBalances({
      balanceSourceType: BalanceSourceType.ERC20,
      addresses: [address],
      sourceOptions: {
        evmChainId: chain_node.eth_chain_id,
        contractAddress: token_address!,
      },
      cacheRefresh: true,
    });
    const balance = balances[address];
    return commonProtocol.calculateVoteWeight(balance, vote_weight_multiplier!);
  }

  // no weighted voting
  return null;
}
