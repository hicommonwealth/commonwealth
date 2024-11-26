import { AppError, ServerError } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import Web3, { AbiFunctionFragment } from 'web3';
import { CommunityAttributes } from '../../models/community';

export const validateCommunityStakeConfig = async (
  community: CommunityAttributes,
  id: number,
) => {
  if (!community.chain_node_id || !community.namespace) {
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

  const factoryData =
    commonProtocol.factoryContracts[
      chainNode.eth_chain_id as commonProtocol.ValidChains
    ];
  const web3 = new Web3(chainNode.private_url);

  const abiItem = {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'whitelist',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
  } as AbiFunctionFragment;

  const calldata = web3.eth.abi.encodeFunctionCall(abiItem, [
    community.namespace_address,
    id,
  ]);
  const whitelistResponse = await web3.eth.call({
    to: factoryData.communityStake,
    data: calldata,
  });
  const whitelisted = web3.eth.abi.decodeParameter('bool', whitelistResponse);

  if (!whitelisted) {
    return new AppError('Community Stake not configured');
  }
};
