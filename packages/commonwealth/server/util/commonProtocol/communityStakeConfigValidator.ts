import { AppError } from '@hicommonwealth/adapters';
import { factoryContracts, ValidChains } from '@hicommonwealth/chains';
import { DB } from '@hicommonwealth/model';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { getNamespace } from './contractHelpers';

export const validateCommunityStakeConfig = async (
  model: DB,
  communityId: string,
  id: number,
) => {
  const community = await model.Community.findOne({
    where: {
      id: communityId,
    },
    include: [
      {
        model: model.ChainNode,
        attributes: ['eth_chain_id', 'url'],
      },
    ],
    attributes: ['namespace'],
  });
  if (!Object.values(ValidChains).includes(community.ChainNode.eth_chain_id)) {
    throw new AppError(
      "Community Stakes not configured for community's chain node",
    );
  }
  const factoryData = factoryContracts[community.ChainNode.eth_chain_id];
  const web3 = new Web3(community.ChainNode.url);
  const namespaceAddress = await getNamespace(
    web3,
    community.namespace,
    factoryData.factory,
  );
  const communityStakes = new web3.eth.Contract(
    [
      {
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
      },
    ] as AbiItem[],
    factoryData.communityStake,
  );
  const whitelisted = await communityStakes.methods
    .whitelist(namespaceAddress, id)
    .call();
  if (!whitelisted) {
    return new AppError('Community Stake not configured');
  }
};
