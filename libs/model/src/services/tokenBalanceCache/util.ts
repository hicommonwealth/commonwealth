import { HttpBatchClient, Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { logger } from '@hicommonwealth/logging';
import AbiCoder from 'web3-eth-abi';
import { toBigInt } from 'web3-utils';
import { ChainNodeAttributes } from '../../models/chain_node';
import { Balances, GetTendermintClientOptions } from './types';

const log = logger(__filename);

/**
 * This function batches hundreds of RPC requests (1 per address) into a few batched RPC requests.
 * This function cannot be used for on-chain batching since several hundred addresses are batched
 * for a single RPC request (not 1 RPC request per address).
 */
export async function evmOffChainRpcBatching(
  source: {
    evmChainId: number;
    url: string;
    contractAddress?: string;
  },
  rpc: {
    method: 'eth_call' | 'eth_getBalance';
    getParams: (
      abiCoder: typeof AbiCoder,
      address: string,
      contractAddress?: string,
    ) => string | Record<string, string>;
    batchSize?: number;
  },
  addresses: string[],
): Promise<{ balances: Balances; failedAddresses: string[] }> {
  if (!rpc.batchSize) rpc.batchSize = 500;

  const batchRequestPromises = [];
  // maps an RPC request id to an address
  const idAddressMap: Balances = {};

  // iterate through addresses in batches of size rpcBatchSize creating a single request for each batch
  let id = 1;
  for (
    let startIndex = 0;
    startIndex < addresses.length;
    startIndex += rpc.batchSize
  ) {
    const endIndex = Math.min(startIndex + rpc.batchSize, addresses.length);
    const batchAddresses = addresses.slice(startIndex, endIndex);
    const rpcRequests = [];
    for (const address of batchAddresses) {
      rpcRequests.push({
        method: rpc.method,
        params: [
          rpc.getParams(AbiCoder, address, source.contractAddress),
          'latest',
        ],
        id,
        jsonrpc: '2.0',
      });
      idAddressMap[id] = address;
      ++id;
    }

    batchRequestPromises.push(
      fetch(source.url, {
        method: 'POST',
        body: JSON.stringify(rpcRequests),
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  let failedAddresses: string[] = [];
  const jsonPromises: Promise<any>[] = [];
  const responses = await Promise.allSettled(batchRequestPromises);
  const chainNodeErrorMsg =
    `${failingChainNodeError} RPC batch request failed for method '${rpc.method}' ` +
    `with batch size ${rpc.batchSize} on evm chain id ${source.evmChainId}${
      source.contractAddress ? ` for token ${source.contractAddress}` : ''
    }.`;
  responses.forEach((res, index) => {
    // handle a failed batch request
    if (res.status === 'rejected') {
      const startIndex = rpc.batchSize! * index;
      const relevantAddresses = addresses.slice(
        startIndex,
        Math.min(startIndex + rpc.batchSize!, addresses.length),
      );
      failedAddresses = [...failedAddresses, ...relevantAddresses];
      log.fatal(chainNodeErrorMsg, res.reason);
    } else {
      jsonPromises.push(res.value.json());
    }
  });

  let datas;
  try {
    datas = (await Promise.all(jsonPromises)).flat();
  } catch (e) {
    log.fatal(chainNodeErrorMsg, e instanceof Error ? e : undefined);
    return {
      balances: {},
      failedAddresses: addresses,
    };
  }

  const balances: Balances = {};
  for (const data of datas) {
    if (data.error) {
      failedAddresses.push(idAddressMap[data.id]);
      const msg = `RPC request failed on EVM chain id ${source.evmChainId}${
        source.contractAddress ? `for token ${source.contractAddress}` : ''
      }.`;
      log.error(msg, data.error);
      continue;
    }

    const address = idAddressMap[data.id];
    balances[address] = source.contractAddress
      ? String(AbiCoder.decodeParameter('uint256', data.result))
      : toBigInt(data.result).toString(10);
  }

  return { balances, failedAddresses };
}

/**
 * This function uses the on-chain Balance Fetcher contract to batch fetch balances
 * for many different addresses using a single RPC request. This is extremely scalable
 * because we can batch multiple requests together e.g. each on-chain call can batch 1k
 * paired with 100 batched RPC requests that means we can fetch 100k address balances
 * from a single HTTP request. ONLY WORKS FOR ERC20 and ETH!
 */
export async function evmBalanceFetcherBatching(
  source: {
    evmChainId: number;
    url: string;
    contractAddress?: string;
  },
  rpc: {
    batchSize?: number;
  },
  addresses: string[],
): Promise<{ balances: Balances; failedAddresses: string[] }> {
  if (!rpc.batchSize) rpc.batchSize = 500;
  // 0x0 tells the on-chain contract to only return ETH balances
  if (!source.contractAddress)
    source.contractAddress = '0x0000000000000000000000000000000000000000';

  const rpcRequests = [];

  for (
    let startIndex = 0;
    startIndex < addresses.length;
    startIndex += rpc.batchSize
  ) {
    const endIndex = Math.min(startIndex + rpc.batchSize, addresses.length);
    const batchAddresses = addresses.slice(startIndex, endIndex);

    const calldata =
      '0xf0002ea9' +
      AbiCoder.encodeParameters(
        ['address[]', 'address[]'],
        [batchAddresses, [source.contractAddress]],
      ).substring(2);

    rpcRequests.push({
      method: 'eth_call',
      params: [
        {
          to: mapNodeToBalanceFetcherContract(source.evmChainId),
          data: calldata,
        },
        'latest',
      ],
      id: startIndex,
      jsonrpc: '2.0',
    });
  }

  const errorMsg =
    `On-chain batch request failed ` +
    `with batch size ${rpc.batchSize} on evm chain id ${source.evmChainId}${
      source.contractAddress ? `for token ${source.contractAddress}` : ''
    }.`;

  const datas = await evmRpcRequest(source.url, rpcRequests, errorMsg);
  if (!datas)
    return {
      balances: {},
      failedAddresses: addresses,
    };

  const addressBalanceMap: Balances = {};
  let failedAddresses: string[] = [];

  if (datas.error) {
    log.error(errorMsg, datas.error);
    return { balances: {}, failedAddresses: addresses };
  } else {
    for (const data of datas) {
      // this replicates the batches used when creating the requests
      // note -> data.id is the startIndex defined in the loop above
      const endIndex = Math.min(data.id + rpc.batchSize, addresses.length);
      const relevantAddresses = addresses.slice(data.id, endIndex);

      if (data.error) {
        failedAddresses = [...failedAddresses, ...relevantAddresses];
        const msg =
          'Balance Fetcher Contract request failed on EVM ' +
          `chain id: ${source.evmChainId}${
            source.contractAddress ? `for token ${source.contractAddress}` : ''
          }.`;
        log.error(msg, data.error);
        continue;
      }

      const balances = AbiCoder.decodeParameter(
        'uint256[]',
        data.result,
      ) as Number[];
      relevantAddresses.forEach(
        (key, i) => (addressBalanceMap[key] = String(balances[i])),
      );
    }
  }

  return { balances: addressBalanceMap, failedAddresses };
}

/**
 * Maps an EVM chain id to the contract address of that chains Balance Checker contract.
 * All supported contract addresses can be found here: https://github.com/wbobeirne/eth-balance-checker
 * Some contract addresses are available in the open PRs or issues.
 */
export function mapNodeToBalanceFetcherContract(
  ethChainId: ChainNodeAttributes['eth_chain_id'],
) {
  switch (ethChainId) {
    case 1: // Ethereum Mainnet
    case 1337: // Local Ganache - assuming fork of mainnet
      return '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39';
    case 5: // Goerli
      return '0x9788C4E93f9002a7ad8e72633b11E8d1ecd51f9b';
    case 56: // BSC
    case 97: // BSC Testnet
      return '0x2352c63A83f9Fd126af8676146721Fa00924d7e4';
    case 137: // Polygon
    case 80001: // Polygon Mumbai
      return '0x2352c63A83f9Fd126af8676146721Fa00924d7e4';
    case 10: // Optimism Mainnet
      return '0xB1c568e9C3E6bdaf755A60c7418C269eb11524FC';
    case 42161: // Arbitrum One
      return '0x151E24A486D7258dd7C33Fb67E4bB01919B7B32c';
    case 43114: // Avalanche
      return '0xD023D153a0DFa485130ECFdE2FAA7e612EF94818';
    case 43113: // Avalanche Testnet
      return '0x100665685d533F65bdD0BD1d65ca6387FC4F4FDB';
    case 250: // Fantom
      return '0x07f697424ABe762bB808c109860c04eA488ff92B';
    case 4002: // Fantom Testnet
      return '0x8B14C79f24986B127EC7208cE4e93E8e45125F8f';
    case 1284: // Moonbeam -- unverified
      return '0xf614056a46e293DD701B9eCeBa5df56B354b75f9';
    case 1285: // Moonriver -- unverified
      return '0xDEAa846cca7FEc9e76C8e4D56A55A75bb0973888';
    case 1313161554: // Aurora Mainnet -- unverified
      return '0x100665685d533F65bdD0BD1d65ca6387FC4F4FDB';
    case 1313161555: // Aurora Testnet -- unverified
      return '0x60d2714e1a9Fd5e9580A66f6aF6b259C77A87b09';
    case 25: // Cronos Mainnet -- unverified
      return '0x8b14c79f24986b127ec7208ce4e93e8e45125f8f';
    case 338: // Cronos Testnet -- unverified
      return '0x8b14c79f24986b127ec7208ce4e93e8e45125f8f';
    case 66: // OKXChain Mainnet:
      return '0x42CD9068d471c861796D56A37f8BFEae19DAC12F';
    case 9001: // Evmos -- unverified
      return '0x42CD9068d471c861796D56A37f8BFEae19DAC12F';
    case 59144: // Linea Mainnet -- unverified
      return '0xF62e6a41561b3650a69Bb03199C735e3E3328c0D';
    case 59140: // Linea Testnet -- unverified
      return '0x10dAd7Ca3921471f616db788D9300DC97Db01783';
    case 11155111: // Sepolia
      return '0xBfbCed302deD369855fc5f7668356e123ca4B329';
  }
}

export const failingChainNodeError = 'FAILING OR RATE LIMITED CHAIN NODE:';

export async function evmRpcRequest(
  rpcEndpoint: string,
  rawRequestBody: Record<string, unknown> | Array<Record<string, unknown>>,
  errorMsg: string,
) {
  let data;
  try {
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      body: JSON.stringify(rawRequestBody),
      headers: { 'Content-Type': 'application/json' },
    });
    data = await response.json();
  } catch (e) {
    const augmentedMsg = `${failingChainNodeError} ${errorMsg}`;
    log.fatal(augmentedMsg, e instanceof Error ? e : undefined);
  }

  return data;
}

export async function getTendermintClient(
  options: GetTendermintClientOptions,
): Promise<Tendermint34Client> {
  const batchClient = new HttpBatchClient(
    options.chainNode?.private_url || options.chainNode.url,
    {
      batchSizeLimit: options.batchSize || 100,
      dispatchInterval: 10,
    },
  );
  return await Tendermint34Client.create(batchClient);
}
