import { factory, formatFilename } from 'common-common/src/logging';
import AbiCoder from 'web3-eth-abi';
import { ChainNodeInstance } from '../../../models/chain_node';
import { rollbar } from '../../rollbar';
import { Balances } from '../types';
import { evmOffChainRpcBatching, evmRpcRequest } from '../util';

const log = factory.getLogger(formatFilename(__filename));

export type GetErc721BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
  batchSize?: number;
};

export async function __getErc721Balances(options: GetErc721BalancesOptions) {
  if (options.addresses.length === 0) {
    return {};
  }

  const rpcEndpoint = options.chainNode.private_url || options.chainNode.url;
  if (options.addresses.length === 1) {
    return await getErc721Balance(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.contractAddress,
      options.addresses[0],
    );
  } else {
    return await getOffChainBatchErc721Balances(
      options.chainNode.eth_chain_id,
      rpcEndpoint,
      options.contractAddress,
      options.addresses,
      options.batchSize,
    );
  }
}

async function getOffChainBatchErc721Balances(
  evmChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
  batchSize = 1000,
): Promise<Balances> {
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
        };
      },
      batchSize,
    },
    addresses,
  );

  return balances;
}

async function getErc721Balance(
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
    rollbar.error(errorMsg, data.error);
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
