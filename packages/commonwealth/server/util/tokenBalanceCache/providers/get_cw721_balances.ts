import { WasmExtension, setupWasmExtension } from '@cosmjs/cosmwasm-stargate';
import { QueryClient } from '@cosmjs/stargate';
import { logger } from '@hicommonwealth/core';
import { ChainNodeInstance } from '@hicommonwealth/model';
import { Balances } from '../types';
import { getTendermintClient } from '../util';

const log = logger().getLogger(__filename);

export type GetCw721BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
  batchSize?: number;
};

export async function __getCw721Balances(
  options: GetCw721BalancesOptions,
): Promise<Balances> {
  if (options.addresses.length === 0) return {};
  const tmClient = await getTendermintClient({
    chainNode: options.chainNode,
    batchSize: options.batchSize,
  });

  const api = QueryClient.withExtensions(tmClient, setupWasmExtension);

  if (options.addresses.length > 1) {
    return await getOffChainBatchCw721Balances(
      api,
      options.contractAddress,
      options.addresses,
    );
  } else {
    return await getCw721Balance(
      api,
      options.addresses[0],
      options.contractAddress,
    );
  }
}

export async function getOffChainBatchCw721Balances(
  api: QueryClient & WasmExtension,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  const balancePromises = [];
  for (const address of addresses) {
    const key = {
      tokens: {
        owner: address,
        start_after: null,
        limit: null,
      },
    };

    balancePromises.push(api.wasm.queryContractSmart(contractAddress, key));
  }

  // this looks like we are parallellizing all the balance queries but
  // that is not the case. The HttpBatchClient defined above handles
  // the queuing and batching of requests all the queries are not
  // actually in parallel
  const promiseResults = await Promise.allSettled<Balances>(balancePromises);

  const result = {};
  addresses.forEach((a, i) => {
    const balanceResult = promiseResults[i];
    if (balanceResult?.status === 'rejected') {
      log.error(
        `Failed to get balance for address ${a}:
        ${balanceResult.reason}`,
      );
    } else {
      result[a] = balanceResult.value?.tokens?.length.toString();
    }
  });
  return result;
}

async function getCw721Balance(
  api: QueryClient & WasmExtension,
  ownerAddress: string,
  contactAddress: string,
): Promise<Balances> {
  try {
    const key = {
      tokens: {
        owner: ownerAddress,
        start_after: null,
        limit: null,
      },
    };
    const result = await api.wasm.queryContractSmart(contactAddress, key);

    return {
      [ownerAddress]: result?.['tokens']?.length.toString(),
    };
  } catch (e) {
    log.error(`Failed to get balance for address ${ownerAddress}`, e);
    return {};
  }
}
