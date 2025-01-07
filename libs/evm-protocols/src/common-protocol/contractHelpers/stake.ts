import Web3, { AbiFunctionFragment } from 'web3';
import { factoryContracts, ValidChains } from '../chainConfig';

export const checkCommunityStakeWhitelist = async ({
  eth_chain_id,
  rpc,
  namespace_address,
  stake_id,
}: {
  eth_chain_id: ValidChains;
  rpc: string;
  namespace_address: string;
  stake_id: number;
}): Promise<boolean> => {
  const web3 = new Web3(rpc);

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
    namespace_address,
    stake_id,
  ]);
  const whitelistResponse = await web3.eth.call({
    to: factoryContracts[eth_chain_id].communityStake,
    data: calldata,
  });
  return !!web3.eth.abi.decodeParameter('bool', whitelistResponse);
};
