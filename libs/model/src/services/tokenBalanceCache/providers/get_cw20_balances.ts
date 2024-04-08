import { WasmExtension, setupWasmExtension } from '@cosmjs/cosmwasm-stargate';
import { QueryClient } from '@cosmjs/stargate';
import { logger } from '@hicommonwealth/core';
import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';
import { getTendermintClient } from '../util';

const log = logger().getLogger(__filename);

export type GetCw20BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
  batchSize?: number;
};

export async function __getCw20Balances(
  options: GetCw20BalancesOptions,
): Promise<Balances> {
  if (options.addresses.length === 0) return {};
  const tmClient = await getTendermintClient({
    chainNode: options.chainNode,
    batchSize: options.batchSize,
  });

  const api = QueryClient.withExtensions(tmClient, setupWasmExtension);

  if (options.addresses.length > 1) {
    return await getOffChainBatchCw20Balances(
      api,
      options.contractAddress,
      options.addresses,
    );
  } else {
    return await getCw20Balance(
      api,
      options.addresses[0],
      options.contractAddress,
    );
  }
}

export async function getOffChainBatchCw20Balances(
  api: QueryClient & WasmExtension,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  const balancePromises = [];
  for (const address of addresses) {
    const key = { balance: { address } };
    balancePromises.push(
      api.wasm.queryContractSmart(contractAddress?.toLowerCase(), key),
    );
  }

  // this looks like we are parallellizing all the balance queries but
  // that is not the case. The HttpBatchClient defined above handles
  // the queuing and batching of requests all the queries are not
  // actually in parallel
  const promiseResults = await Promise.allSettled<Balances>(balancePromises);

  const result: Balances = {};
  addresses.forEach((a, i) => {
    const balanceResult = promiseResults[i];
    if (balanceResult?.status === 'rejected') {
      log.error(
        `Failed to get balance for address ${a}:
        ${balanceResult.reason}`,
      );
    } else {
      result[a] = balanceResult?.value?.balance?.toString();
    }
  });
  return result;
}

async function getCw20Balance(
  api: QueryClient & WasmExtension,
  ownerAddress: string,
  contactAddress: string,
): Promise<Balances> {
  try {
    const key = { balance: { address: ownerAddress } };
    const result = await api.wasm.queryContractSmart(
      contactAddress?.toLowerCase(),
      key,
    );

    return {
      [ownerAddress]: result?.balance?.toString(),
    };
  } catch (e) {
    log.error(
      `Failed to get balance for address ${ownerAddress}`,
      e instanceof Error ? e : undefined,
    );
    return {};
  }
}
