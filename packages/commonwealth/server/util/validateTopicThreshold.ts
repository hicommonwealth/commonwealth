import BN from 'bn.js';
import { factory, formatFilename } from 'common-common/src/logging';
import type { TokenBalanceCache } from 'token-balance-cache/src/index';
import { FetchTokenBalanceErrors } from 'token-balance-cache/src/index';
import type { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

const validateTopicThreshold = async (
  tbc: TokenBalanceCache,
  models: DB,
  topicId: number,
  userAddress: string
): Promise<boolean> => {
  if (!topicId || !userAddress) return true;
  try {
    const topic = await models.Topic.findOne({
      where: { id: topicId },
      include: [
        {
          model: models.Chain,
          required: true,
          as: 'chain',
          include: [
            {
              model: models.ChainNode,
              required: true,
            },
          ],
        },
      ],
    });
    if (!topic?.chain?.ChainNode?.id) {
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
      where: { chain_id: topic.chain.id },
      include: [{ model: models.Contract, required: true }],
    });

    try {
      const balance = await tbc.fetchUserBalance(
        topic.chain.network,
        topic.chain.ChainNode.id,
        userAddress,
        communityContracts?.Contract?.address
      );

      return new BN(balance).gte(threshold);
    } catch (e) {
      if (e.message === FetchTokenBalanceErrors.NoBalanceProvider) {
        return true;
      } else {
        throw e;
      }
    }
  } catch (err) {
    log.warn(
      `Could not validate topic threshold for ${topicId}: ${err.message}`
    );
    return false;
  }
};

export default validateTopicThreshold;
