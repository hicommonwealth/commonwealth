import { NamespaceFactoryAbi } from '@commonxyz/common-protocol-abis';
import { getFactoryContract } from '@hicommonwealth/evm-protocols';
import { stringToHex } from 'viem';
import { EvmProtocolChain, getPublicClient } from '../utils';

/**
 * Retrieves a namespace.
 * @param chain
 * @param namespace
 */
export const getNamespace = async (
  chain: EvmProtocolChain,
  namespace: string,
): Promise<`0x${string}`> => {
  const client = getPublicClient(chain);
  return await client.readContract({
    address: getFactoryContract(chain.eth_chain_id).NamespaceFactory,
    abi: NamespaceFactoryAbi,
    functionName: 'getNamespace',
    args: [stringToHex(namespace, { size: 32 })],
  });
};
