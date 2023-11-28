import Web3 from 'web3';
import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';
import {
  evmBalanceFetcherBatching,
  evmOffChainRpcBatching,
  mapNodeToBalanceFetcherContract,
} from '../util';

export type GetEthBalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
};

export async function __getEthBalances(options: GetEthBalancesOptions) {
  if (options.addresses.length === 0) {
    return {};
  }

  const rpcEndpoint = options.chainNode.private_url || options.chainNode.url;
  if (options.addresses.length === 1) {
    return await getEthBalance(rpcEndpoint, options.addresses[0]);
  }

  const balanceFetcherContract = mapNodeToBalanceFetcherContract(
    options.chainNode.eth_chain_id,
  );
  if (balanceFetcherContract) {
    return await getOnChainBatchEthBalances(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.addresses,
    );
  } else {
    return await getOffChainBatchEthBalances(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.addresses,
    );
  }
}

async function getOnChainBatchEthBalances(
  evmChainId: number,
  rpcEndpoint: string,
  addresses: string[],
): Promise<Balances> {
  const { balances } = await evmBalanceFetcherBatching(
    {
      evmChainId,
      url: rpcEndpoint,
    },
    {
      batchSize: 1000,
    },
    addresses,
  );

  return balances;
}

async function getOffChainBatchEthBalances(
  evmChainId: number,
  rpcEndpoint: string,
  addresses: string[],
): Promise<Balances> {
  const { balances } = await evmOffChainRpcBatching(
    {
      evmChainId,
      url: rpcEndpoint,
    },
    {
      method: 'eth_getBalance',
      getParams: (web3, address, contractAddress) => {
        return address;
      },
      batchSize: 1000,
    },
    addresses,
  );
  return balances;
}

async function getEthBalance(
  rpcEndpoint: string,
  address: string,
): Promise<Balances> {
  const web3 = new Web3();
  const requestBody = {
    method: 'eth_getBalance',
    params: [address, 'latest'],
    id: 1,
    jsonrpc: '2.0',
  };

  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();

  return {
    [address]: web3.eth.abi.decodeParameter(
      'uint256',
      data.result,
    ) as unknown as string,
  };
}
