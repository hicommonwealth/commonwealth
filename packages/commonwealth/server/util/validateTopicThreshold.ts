import BN from 'bn.js';
import {
  FetchTokenBalanceErrors,
  TokenBalanceCache,
} from 'token-balance-cache/src/index';

import type { DB } from '../models';

const validateTopicThreshold = async (
  tbc: TokenBalanceCache,
  models: DB,
  topicId: number,
  userAddress: string,
): Promise<boolean> => {
  if (!topicId || !userAddress) return true;
  const topic = await models.Topic.findOne({
    where: { id: topicId },
    include: [
      {
        model: models.Community,
        required: true,
        as: 'community',
        include: [
          {
            model: models.ChainNode,
            required: true,
          },
        ],
      },
    ],
  });
  if (!topic?.community?.ChainNode?.id) {
    // if we have no node, always approve
    return true;
  }
  // skip query if no threshold
  const threshold = new BN(topic.token_threshold || '0');
  if (threshold.isZero()) {
    return true;
  }

  // TODO: @JAKE in the future, we will have more than one contract,
  // need to handle this through the TBC Rule, passing in associated Contract.id
  const communityContracts = await models.CommunityContract.findOne({
    where: { chain_id: topic.community.id },
    include: [{ model: models.Contract, required: true }],
  });

  try {
    const balance = await tbc.fetchUserBalance(
      topic.community.network,
      topic.community.ChainNode.id,
      userAddress,
      communityContracts?.Contract?.address,
    );

    return new BN(balance).gte(threshold);
  } catch (e) {
    if (e.message === FetchTokenBalanceErrors.NoBalanceProvider) {
      return true;
    } else {
      throw e;
    }
  }
};

export default validateTopicThreshold;
