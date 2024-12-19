import { CustomRetryStrategyError } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';

export async function chainNodeMustExist(ethChainId: number) {
  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      eth_chain_id: ethChainId,
    },
  });

  if (!chainNode) {
    // dead-letter with no retries -- should never happen
    throw new CustomRetryStrategyError(
      `Chain node with eth_chain_id ${ethChainId} not found!`,
      { strategy: 'nack' },
    );
  }

  return chainNode;
}
