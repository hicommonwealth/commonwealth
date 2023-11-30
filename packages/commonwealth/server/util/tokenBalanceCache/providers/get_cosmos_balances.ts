import { ChainNodeInstance } from '../../../models/chain_node';
import { Balances } from '../types';

export type GetCosmosBalanceOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
};

export async function __getCosmosNativeBalances(
  options: GetCosmosBalanceOptions,
): Promise<Balances> {
  return {};
}

async function getOffChainBatchCosmosBalances(
  rpcEndpoint: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getCosmosBalance(
  rpcEndpoint: string,
  address: string,
): Promise<Balances> {
  return {};
}
