import { AppError } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/shared';
import Web3, { AbiFunctionFragment } from 'web3';
import { CommunityAttributes } from '../../models/community';

export const validateCommunityStakeConfig = async (
  community: CommunityAttributes,
  id: number,
) => {
  if (!community.ChainNode?.eth_chain_id || !community.namespace) {
    throw new AppError('Invalid community');
  }
  const chain_id = community.ChainNode.eth_chain_id;
  if (!Object.values(commonProtocol.ValidChains).includes(chain_id)) {
    throw new AppError(
      "Community Stakes not configured for community's chain node",
    );
  }
  const factoryData =
    commonProtocol.factoryContracts[chain_id as commonProtocol.ValidChains];
  const web3 = new Web3(community.ChainNode.url);

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
