import { logger } from '@hicommonwealth/core';
import AbiCoder from 'web3-eth-abi';
import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';
import {
  evmBalanceFetcherBatching,
  evmOffChainRpcBatching,
  evmRpcRequest,
  mapNodeToBalanceFetcherContract,
} from '../util';

const log = logger().getLogger(import.meta.filename);

export type GetErc20BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
  batchSize?: number;
};

export async function __getErc20Balances(
  options: GetErc20BalancesOptions,
): Promise<Balances> {
  if (options.addresses.length === 0) {
    return {};
  }

  const rpcEndpoint = options.chainNode.private_url || options.chainNode.url;
  if (options.addresses.length === 1) {
    return await getErc20Balance(
      options.chainNode.eth_chain_id!,
      rpcEndpoint,
      options.contractAddress,
      options.addresses[0],
    );
  }

  const balanceFetcherContract = mapNodeToBalanceFetcherContract(
    options.chainNode.eth_chain_id,
  );
  if (balanceFetcherContract) {
    return await getOnChainBatchErc20Balances(
      options.chainNode.eth_chain_id!,
      rpcEndpoint,
      options.contractAddress,
      options.addresses,
      options.batchSize,
    );
  } else {
    return await getOffChainBatchErc20Balances(
      options.chainNode.eth_chain_id!,
      rpcEndpoint,
      options.contractAddress,
      options.addresses,
      options.batchSize,
    );
  }
}

async function getOnChainBatchErc20Balances(
  ethChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
  batchSize = 1000,
): Promise<Balances> {
  // ignore failedAddresses returned property for now -> revisit if we want to implement retry strategy
  const { balances } = await evmBalanceFetcherBatching(
    {
      evmChainId: ethChainId,
      url: rpcEndpoint,
      contractAddress: contractAddress,
    },
    {
      batchSize,
    },
    addresses,
  );
  return balances;
}

async function getOffChainBatchErc20Balances(
  evmChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
  batchSize = 1000,
): Promise<Balances> {
  // ignore failedAddresses returned property for now -> revisit if we want to implement retry strategy
  const { balances } = await evmOffChainRpcBatching(
    {
      evmChainId,
      url: rpcEndpoint,
      contractAddress,
    },
    {
      method: 'eth_call',
      getParams: (abiCoder, address, tokenAddress) => {
        const calldata =
          '0x70a08231' +
          abiCoder.encodeParameters(['address'], [address]).substring(2);
        return {
          to: tokenAddress,
          data: calldata,
        } as Record<string, any>;
      },
      batchSize,
    },
    addresses,
  );
  return balances;
}

async function getErc20Balance(
  evmChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  address: string,
): Promise<Balances> {
  const calldata =
    '0x70a08231' +
    AbiCoder.encodeParameters(['address'], [address]).substring(2);
  const requestBody = {
    method: 'eth_call',
    params: [
      {
        to: contractAddress,
        data: calldata,
      },
      'latest',
    ],
    id: 1,
    jsonrpc: '2.0',
  };

  const errorMsg =
    `ERC20 balance fetch failed for address ${address} ` +
    `on evm chain id ${evmChainId} for contract ${contractAddress}.`;

  const data = await evmRpcRequest(rpcEndpoint, requestBody, errorMsg);
  if (!data) return {};

  if (data.error) {
    log.error(errorMsg, data.error);
    return {};
  } else {
    return {
      [address]: AbiCoder.decodeParameter(
        'uint256',
        data.result,
      ) as unknown as string,
    };
  }
}
