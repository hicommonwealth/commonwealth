import { ChainNetwork } from 'common-common/src/types';
import TokenBalanceCache from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';

import { DB } from '../database';

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
          include: [{
            model: models.ChainNode,
            required: true,
          }]
        },
      ]
    });
    if (!topic?.chain?.ChainNode?.balance_type) {
      // if we have no balance type for node, always approve
      return true;
    }

    const communityContracts = await models.CommunityContract.findOne({
      where: { chain_id: topic.chain.id },
      include: [{ model: models.Contract, required: true }],
    });
    // TODO: @JAKE in the future, we will have more than one contract,
      // need to handle this through the TBC Rule, passing in associated Contract.id
    const threshold = topic.token_threshold;
    if (threshold && threshold > 0) {
      const tokenBalance = await tbc.getBalance(
        topic.chain.chain_node_id,
        userAddress,
        communityContracts?.Contract?.address,
        topic.chain.network === ChainNetwork.ERC20
          ? 'erc20' : topic.chain.network === ChainNetwork.ERC721
            ? 'erc721' : topic.chain.network === ChainNetwork.SPL
              ? 'spl-token' : undefined,
      );
      log.info(`Balance: ${tokenBalance.toString()}, threshold: ${threshold.toString()}`);
      return tokenBalance.gten(threshold);
    } else {
      return true;
    }
  } catch (err) {
    log.warn(`Could not validate topic threshold for ${topicId}: ${err.message}`);
    return false;
  }

};

export default validateTopicThreshold;