import { factory, formatFilename } from 'common-common/src/logging';
import AbiCoder from 'web3-eth-abi';
import { ChainNodeInstance } from '../../../models/chain_node';
import { rollbar } from '../../rollbar';
import { Balances } from '../types';
import {
  evmBalanceFetcherBatching,
  evmOffChainRpcBatching,
  mapNodeToBalanceFetcherContract,
} from '../util';

const log = factory.getLogger(formatFilename(__filename));

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
      options.chainNode.eth_chain_id,
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
      getParams: (abiCoder, address, contractAddress) => {
        const calldata =
          '0x70a08231' +
          abiCoder.encodeParameters(['address'], [address]).substring(2);
        return {
          to: contractAddress,
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

  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();

  if (data.error) {
    const msg =
      `ERC20 balance fetch failed for address ${address} ` +
      `on evm chain id ${evmChainId}`;
    rollbar.error(msg, data.error);
    log.error(msg, data.error);
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
