import { ChainNodeInstance } from '../../models/chain_node';
import { Balances } from '../server_token_balance_controller';

export type GetEthBalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
};

export async function __getEthBalances(options: GetEthBalancesOptions) {}

async function getOnChainBatchEthBalances(
  ethChainId: number,
  rpcEndpoint: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getOffChainBatchEthBalances(
  rpcEndpoint: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getEthBalance(
  rpcEndpoint: string,
  address: string,
): Promise<Balances> {
  return {};
}
