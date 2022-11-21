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

    const threshold = new BN(topic.token_threshold || '0');
    if (!threshold.isZero()) {
      // TODO: @JAKE in the future, we will have more than one contract,
      // need to handle this through the TBC Rule, passing in associated Contract.id

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

      // grab contract if provided, otherwise query native token
      let opts = {};
      if (communityContracts?.Contract?.address) {
        let contractType: string | undefined;
        if (topic.chain.network === ChainNetwork.ERC20) {
          contractType = 'erc20';
        } else if (topic.chain.network === ChainNetwork.ERC721) {
          contractType = 'erc721';
        } else {
          throw new Error('Unsupported contract type');
        }
        opts = {
          tokenAddress: communityContracts?.Contract?.address,
          contractType,
        }
      }

      const tokenBalances = await tbc.getBalancesForAddresses(
        topic.chain.chain_node_id,
        [ userAddress ],
        bp,
        opts,
      );
      if (tokenBalances.errors[userAddress] || !tokenBalances.balances[userAddress]) {
        throw new Error(tokenBalances.errors[userAddress] || `No token balance queried for ${userAddress}`);
      }
      const tokenBalance = new BN(tokenBalances.balances[userAddress]);
      return tokenBalance.gte(threshold);
    } else {
      return true;
    }
  } catch (err) {
    log.warn(`Could not validate topic threshold for ${topicId}: ${err.message}`);
    return false;
  }

};

export default validateTopicThreshold;