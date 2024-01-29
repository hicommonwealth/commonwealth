import {
  BankExtension,
  Coin,
  QueryClient,
  StakingExtension,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { logger } from '@hicommonwealth/core';
import { ChainNodeInstance } from '@hicommonwealth/model';
import { Balances } from '../types';
import { getTendermintClient } from '../util';

const log = logger().getLogger(__filename);

export type GetCosmosNativeBalanceOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  batchSize?: number;
};

export async function __getCosmosNativeBalances(
  options: GetCosmosNativeBalanceOptions,
): Promise<Balances> {
  if (options.addresses.length === 0) return {};
  const tmClient = await getTendermintClient({
    chainNode: options.chainNode,
    batchSize: options.batchSize,
  });

  const api = QueryClient.withExtensions(
    tmClient,
    setupBankExtension,
    setupStakingExtension,
  );

  const { params } = await api.staking.params();
  const denom = params?.bondDenom;

  if (!denom) {
    const msg = `Could not query staking params for cosmos chain id: ${options.chainNode.cosmos_chain_id}`;
    log.error(msg);
    throw new Error('Could not query staking params');
  }

  if (options.addresses.length > 1) {
    return await getOffChainBatchCosmosNativeBalances(
      api,
      options.addresses,
      denom,
    );
  } else {
    return await getCosmosNativeBalance(api, options.addresses[0], denom);
  }
}

async function getOffChainBatchCosmosNativeBalances(
  api: QueryClient & BankExtension & StakingExtension,
  addresses: string[],
  denom: string,
): Promise<Balances> {
  const balancePromises = [];
  for (const address of addresses) {
    balancePromises.push(api.bank.balance(address, denom));
  }

  // this looks like we are parallizing all the balance queries but
  // that is not the case. The HttpBatchClient defined above handles
  // the queuing and batching of requests all the queries are not
  // actually in parallel
  const promiseResults = await Promise.allSettled<Coin>(balancePromises);

  const result = {};
  addresses.forEach((a, i) => {
    const balanceResult = promiseResults[i];
    if (balanceResult.status === 'rejected') {
      log.error(`Failed to get balance for address ${a}`, balanceResult.reason);
    } else {
      result[a] = balanceResult.value.amount;
    }
  });
  return result;
}

async function getCosmosNativeBalance(
  api: QueryClient & BankExtension & StakingExtension,
  address: string,
  denom: string,
): Promise<Balances> {
  try {
    const result = await api.bank.balance(address, denom);
    return {
      [address]: result.amount,
    };
  } catch (e) {
    log.error(`Failed to get balance for address ${address}`, e);
    return {};
  }
}
