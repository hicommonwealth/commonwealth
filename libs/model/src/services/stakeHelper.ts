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
 * @param community_id community id
 * @param address user's address
 * @returns voting weight or null if no stake if found
 */
export async function getVotingWeight(
  topic_id: number,
  address: string,
): Promise<number | null> {
  if (config.STAKE.REACTION_WEIGHT_OVERRIDE)
    return config.STAKE.REACTION_WEIGHT_OVERRIDE;

  const topic = await models.Topic.findByPk(topic_id);
  mustExist('Topic', topic);
  if (topic.weighted_voting === TopicWeightedVoting.Stake) {
    const stake = await models.CommunityStake.findOne({
      where: { community_id: topic.community_id },
    });
    mustExist('CommunityStake', stake);

    const community = await models.Community.findByPk(topic.community_id);
    mustExist('Community', community);
    mustExist('Chain Node Id', community.chain_node_id);

    const node = await models.ChainNode.findByPk(community.chain_node_id!);
    mustExist('Chain Node', node);
    mustExist('Eth Chain Id', node.eth_chain_id);

    const stakeBalances = await contractHelpers.getNamespaceBalance(
      community.namespace_address!,
      stake.stake_id,
      node.eth_chain_id,
      [address],
    );
    const stakeBalance = stakeBalances[address];
    if (BigNumber.from(stakeBalance).lte(0))
      throw new InvalidState('Must have stake to upvote');

    return commonProtocol.calculateVoteWeight(stakeBalance, stake.vote_weight);
  } else if (topic.weighted_voting === TopicWeightedVoting.ERC20) {
    const { chain_node_id, token_address, vote_weight_multiplier } = topic;
    mustExist('Topic Chain Node Id', topic.chain_node_id);

    const node = await models.ChainNode.findByPk(chain_node_id!);
    mustExist('Chain Node', node);
    mustExist('Eth Chain Id', node.eth_chain_id);

    const balances = await tokenBalanceCache.getBalances({
      balanceSourceType: BalanceSourceType.ERC20,
      addresses: [address],
      sourceOptions: {
        evmChainId: node.eth_chain_id,
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
