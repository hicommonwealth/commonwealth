import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

/**
 * Retrieves a namespace.
 * @param rpcNodeUrl Note this MUST be a private_url with no associated whitelist.
 * @param namespace
 * @param factoryAddress
 */
export const getNamespace = async (
  rpcNodeUrl: string,
  namespace: string,
  factoryAddress: string,
): Promise<string> => {
  const web3 = new Web3(rpcNodeUrl);
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
  const activeNamespace = await factory.methods
    .getNamespace(hexString.padEnd(66, '0'))
    .call();
  return String(activeNamespace);
};
