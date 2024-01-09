import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

export const getNamespace = async (
  web3: Web3,
  namespace: string,
  factoryAddress: string,
): Promise<string> => {
  const factory = new web3.eth.Contract(
    [
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: '',
            type: 'bytes32',
          },
        ],
        stateMutability: 'view',
        type: 'function',
        name: 'getNamespace',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
      },
    ] as AbiItem[],
    factoryAddress,
  );

  const hexString = web3.utils.utf8ToHex(namespace);
  const activeNamespace = await factory.methods.getNamespace(hexString).call();
  return activeNamespace;
};
