import BN from 'bn.js';
import { ChainNetwork } from 'common-common/src/types';
import { TokenBalanceCache } from 'token-balance-cache/src/index';
import { factory, formatFilename } from 'common-common/src/logging';

import { DB } from '../models';

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
    if (!topic?.chain?.ChainNode?.id) {
      // if we have no node, always approve
      return true;
    }
    let bp: string;
    try {
      const result = await tbc.getBalanceProviders(topic.chain.ChainNode.id);
      bp = result[0].bp;
    } catch (e) {
      log.info(`No balance provider for chain node ${topic.chain.ChainNode.name}, skipping check.`);
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
      const tokenBalances = await tbc.getBalancesForAddresses(
        topic.chain.chain_node_id,
        [ userAddress ],
        bp,
        {
          contractType: topic.chain.network === ChainNetwork.ERC20
          ? 'erc20' : topic.chain.network === ChainNetwork.ERC721
            ? 'erc721' : undefined,
          tokenAddress: communityContracts?.Contract?.address,
        }
      );
      if (tokenBalances.errors[userAddress] || !tokenBalances.balances[userAddress]) {
        throw new Error(tokenBalances.errors[userAddress] || `No token balance queried for ${userAddress}`);
      }
      const tokenBalance = new BN(tokenBalances.balances[userAddress]);
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