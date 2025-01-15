import { AppError, ServerError } from '@hicommonwealth/core';
import {
  checkCommunityStakeWhitelist,
  commonProtocol,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { CommunityAttributes } from '../../models/community';

export const validateCommunityStakeConfig = async (
  community: CommunityAttributes,
  id: number,
) => {
  if (
    !community.chain_node_id ||
    !community.namespace ||
    !community.namespace_address
  ) {
    throw new AppError(`Community ${community.id} is invalid`);
  }

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      id: community.chain_node_id,
    },
  });

  if (!chainNode) {
    throw new ServerError(`ChainNode not found`);
  }

  if (
    !chainNode.eth_chain_id ||
    !chainNode.private_url ||
    !Object.values(commonProtocol.ValidChains).includes(chainNode.eth_chain_id)
  ) {
    throw new AppError(`Community Stakes not available on ${chainNode.name}`);
  }

  const whitelisted = await checkCommunityStakeWhitelist({
    eth_chain_id: chainNode.eth_chain_id,
    rpc: chainNode.private_url,
    namespace_address: community.namespace_address,
    stake_id: id,
  });

  if (!whitelisted) {
    return new AppError('Community Stake not configured');
  }
};
