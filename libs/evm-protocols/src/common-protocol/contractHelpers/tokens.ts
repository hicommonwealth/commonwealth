import {
  ContestGovernorAbi,
  ContestGovernorSingleAbi,
} from '@commonxyz/common-protocol-abis';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { createPublicClient, http } from 'viem';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { erc20Abi } from '../../abis/erc20Abi';
import { isValidChain } from '../chainConfig';
import { Denominations, ViemChains, WeiDecimals } from '../utils';

/**
 * Gets token ticker and decimal places to wei
 * @param address
 * @param rpcNodeUrl Note this MUST be a private_url with no associated whitelist.
 * @param fetchFromContest
 */
export const getTokenAttributes = async (
  address: string,
  rpcNodeUrl: string,
  fetchFromContest: boolean,
  isOneOffContest?: boolean,
): Promise<{
  ticker: string | Denominations;
  decimals: number;
}> => {
  const web3 = new Web3(rpcNodeUrl);
  let addr = address;
  if (fetchFromContest) {
    const abi = isOneOffContest ? ContestGovernorSingleAbi : ContestGovernorAbi;
    const contest = new web3.eth.Contract(abi, address);
    addr = await contest.methods.contestToken().call();
  }
  if (addr === ZERO_ADDRESS) {
    return Promise.resolve({
      ticker: Denominations.ETH,
      decimals: WeiDecimals[Denominations.ETH],
    });
  }
  const contract = new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ] as AbiItem[],
    addr,
  );
  const [symbol, decimals] = await Promise.all([
    contract.methods.symbol().call(),
    contract.methods.decimals().call(),
  ]);
  return {
    ticker: String(symbol),
    decimals: parseInt(String(decimals)),
  };
};

export async function getErc20TokenInfo({
  eth_chain_id,
  rpc,
  tokenAddress,
}: {
  eth_chain_id: number;
  rpc: string;
  tokenAddress: string;
}): Promise<{ name: string; symbol: string; totalSupply: bigint }> {
  if (!isValidChain(eth_chain_id)) {
    throw new Error(`Invalid eth_chain_id: ${eth_chain_id}`);
  }
  const client = createPublicClient({
    chain: ViemChains[eth_chain_id],
    transport: http(rpc),
  });
  const [name, symbol, totalSupply] = await Promise.all([
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'name',
    }),
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'symbol',
    }),
    client.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'totalSupply',
    }),
  ]);
  return {
    name,
    symbol,
    totalSupply,
  };
}
