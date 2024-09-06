import { InvalidState } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/shared';
import { BigNumber } from 'ethers';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { contractHelpers } from '../services/commonProtocol';

/**
 * Calculates voting weight of address on a community with stake
 * @param community_id community id
 * @param address user's address
 * @returns voting weight or null if no stake if found
 */
export async function getVotingWeight(
  community_id: string,
  address: string,
): Promise<number | null> {
  if (config.STAKE.REACTION_WEIGHT_OVERRIDE)
    return config.STAKE.REACTION_WEIGHT_OVERRIDE;

  const stake = await models.CommunityStake.findOne({
    where: { community_id },
  });
  if (!stake) return null;

  const community = await models.Community.findByPk(community_id);
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
}
