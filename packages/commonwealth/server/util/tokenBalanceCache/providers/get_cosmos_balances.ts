import {
  BankExtension,
  Coin,
  QueryClient,
  StakingExtension,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { HttpBatchClient, Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';

export type GetCosmosBalanceOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
};

export async function __getCosmosNativeBalances(
  options: GetCosmosBalanceOptions,
): Promise<Balances> {
  let tmClient: Tendermint34Client;
  if (options.addresses.length > 1) {
    const batchClient = new HttpBatchClient(
      options.chainNode.private_url || options.chainNode.url,
      {
        batchSizeLimit: 100,
        dispatchInterval: 10,
      },
    );
    tmClient = await Tendermint34Client.create(batchClient);
  } else {
    tmClient = await Tendermint34Client.connect(
      options.chainNode.private_url || options.chainNode.url,
    );
  }

  const api = QueryClient.withExtensions(
    tmClient,
    setupBankExtension,
    setupStakingExtension,
  );

  const { params } = await api.staking.params();
  const denom = params?.bondDenom;

  if (!denom) {
    throw new Error('Could not query staking params');
  }

  if (options.addresses.length > 1) {
    return await getOffChainBatchCosmosBalances(api, options.addresses, denom);
  } else {
    return await getCosmosBalance(api, options.addresses[0], denom);
  }
}

async function getOffChainBatchCosmosBalances(
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
      console.error(balanceResult.reason);
    } else {
      result[a] = balanceResult.value.amount;
    }
  });
  return result;
}

async function getCosmosBalance(
  api: QueryClient & BankExtension & StakingExtension,
  address: string,
  denom: string,
): Promise<Balances> {
  const result = await api.bank.balance(address, denom);
  return {
    [address]: result.amount,
  };
}
