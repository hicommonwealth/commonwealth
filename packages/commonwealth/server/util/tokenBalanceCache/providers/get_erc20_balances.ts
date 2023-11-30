import Web3 from 'web3';
import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';
import {
  evmBalanceFetcherBatching,
  evmOffChainRpcBatching,
  mapNodeToBalanceFetcherContract,
} from '../util';

export type GetErc20BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
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
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.contractAddress,
      options.addresses,
    );
  } else {
    return await getOffChainBatchErc20Balances(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.contractAddress,
      options.addresses,
    );
  }
}

async function getOnChainBatchErc20Balances(
  ethChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  // ignore failedAddresses returned property for now -> revisit if we want to implement retry strategy
  const { balances } = await evmBalanceFetcherBatching(
    {
      evmChainId: ethChainId,
      url: rpcEndpoint,
      contractAddress: contractAddress,
    },
    {
      batchSize: 1000,
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
      getParams: (web3, address, tokenAddress) => {
        const calldata =
          '0x70a08231' +
          web3.eth.abi.encodeParameters(['address'], [address]).substring(2);
        return {
          to: tokenAddress,
          data: calldata,
        };
      },
      batchSize: 1000,
    },
    addresses,
  );
  return balances;
}

async function getErc20Balance(
  rpcEndpoint: string,
  contractAddress: string,
  address: string,
): Promise<Balances> {
  const web3 = new Web3();
  const calldata =
    '0x70a08231' +
    web3.eth.abi.encodeParameters(['address'], [address]).substring(2);
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
