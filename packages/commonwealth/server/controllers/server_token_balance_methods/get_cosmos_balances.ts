import { ChainNodeInstance } from '../../models/chain_node';
import { Balances } from '../server_token_balance_controller';

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
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getCosmosBalance(
  rpcEndpoint: string,
  contractAddress: string,
  address: string,
): Promise<Balances> {
  return {};
}
