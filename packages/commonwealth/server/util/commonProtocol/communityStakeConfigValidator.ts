import { AppError } from '@hicommonwealth/adapters';
import { DB } from 'server/models';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { factoryContracts, validChains } from './chainConfig';
import { getNamespace } from './contractHelpers';

export const validateCommunitStakeConfig = async (
  model: DB,
  namespace: string,
  id: number,
  chain: validChains,
) => {
  const factoryData = factoryContracts[chain];
  const node = await model.ChainNode.findOne({
    where: {
      eth_chain_id: factoryData.chainId,
    },
    attributes: ['url'],
  });
  const web3 = new Web3(node.url);
  const namespaceAddress = await getNamespace(
    web3,
    namespace,
    factoryData.factory,
  );
  const communityStakes = new web3.eth.Contract(
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
    } as AbiItem,
    factoryData.communityStake,
  );
  const whitelisted = await communityStakes.methods
    .whitelist(namespaceAddress, id)
    .call();
  if (!whitelisted) {
    return new AppError('Community Stake not configured');
  }
};
