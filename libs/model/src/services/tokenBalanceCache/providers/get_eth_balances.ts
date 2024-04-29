import { logger } from '@hicommonwealth/logging';
import { toBigInt } from 'web3-utils';
import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';
import {
  evmBalanceFetcherBatching,
  evmOffChainRpcBatching,
  evmRpcRequest,
  mapNodeToBalanceFetcherContract,
} from '../util';

const log = logger(__filename);

export type GetEthBalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  batchSize?: number;
};

export async function __getEthBalances(options: GetEthBalancesOptions) {
  if (options.addresses.length === 0) {
    return {};
  }

  const rpcEndpoint = options.chainNode.private_url || options.chainNode.url;
  if (options.addresses.length === 1) {
    return await getEthBalance(
      options.chainNode.eth_chain_id!,
      rpcEndpoint,
      options.addresses[0],
    );
  }

  const balanceFetcherContract = mapNodeToBalanceFetcherContract(
    options.chainNode.eth_chain_id,
  );
  if (balanceFetcherContract) {
    return await getOnChainBatchEthBalances(
      options.chainNode.eth_chain_id!,
      rpcEndpoint,
      options.addresses,
      options.batchSize,
    );
  } else {
    return await getOffChainBatchEthBalances(
      options.chainNode.eth_chain_id!,
      rpcEndpoint,
      options.addresses,
      options.batchSize,
    );
  }
}

async function getOnChainBatchEthBalances(
  evmChainId: number,
  rpcEndpoint: string,
  addresses: string[],
  batchSize = 1000,
): Promise<Balances> {
  const { balances } = await evmBalanceFetcherBatching(
    {
      evmChainId,
      url: rpcEndpoint,
    },
    {
      batchSize,
    },
    addresses,
  );

  return balances;
}

async function getOffChainBatchEthBalances(
  evmChainId: number,
  rpcEndpoint: string,
  addresses: string[],
  batchSize = 1000,
): Promise<Balances> {
  const { balances } = await evmOffChainRpcBatching(
    {
      evmChainId,
      url: rpcEndpoint,
    },
    {
      method: 'eth_getBalance',
      getParams: (_abiCoder, address, _tokenAddress) => {
        return address;
      },
      batchSize,
    },
    addresses,
  );
  return balances;
}

async function getEthBalance(
  evmChainId: number,
  rpcEndpoint: string,
  address: string,
): Promise<Balances> {
  const requestBody = {
    method: 'eth_getBalance',
    params: [address, 'latest'],
    id: 1,
    jsonrpc: '2.0',
  };

  const errorMsg =
    `Eth balance fetch failed for address ${address} ` +
    `on evm chain id ${evmChainId}`;

  const data = await evmRpcRequest(rpcEndpoint, requestBody, errorMsg);
  if (!data) return {};

  if (data.error) {
    log.error(errorMsg, data.error);
    return {};
  } else {
    return {
      [address]: toBigInt(data.result).toString(10),
    };
  }
}
