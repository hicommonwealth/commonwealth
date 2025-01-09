import {
  commonProtocol,
  contestAbi,
  erc20Abi,
} from '@hicommonwealth/evm-protocols';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Denominations, WeiDecimals } from '../utils';

export type TokenAttributes = {
  ticker: string | commonProtocol.Denominations;
  decimals: number;
};

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
): Promise<TokenAttributes> => {
  const web3 = new Web3(rpcNodeUrl);
  let addr = address;
  if (fetchFromContest) {
    const contest = new web3.eth.Contract(contestAbi as AbiItem[], address);
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
  rpc,
  tokenAddress,
}: {
  rpc: string;
  tokenAddress: string;
}): Promise<{ name: string; symbol: string; totalSupply: bigint }> {
  const web3 = new Web3(rpc);
  const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
  const [name, symbol, totalSupply] = await Promise.all([
    erc20Contract.methods.name().call(),
    erc20Contract.methods.symbol().call(),
    erc20Contract.methods.totalSupply().call(),
  ]);
  return {
    name,
    symbol,
    totalSupply: totalSupply as bigint,
  };
}
