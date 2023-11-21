import { ChainNodeInstance } from '../../models/chain_node';
import { Balances } from '../server_token_balance_controller';

export type GetErc20BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
};

export async function __getErc20Balances(
  options: GetErc20BalancesOptions,
): Promise<Balances> {
  return {};
}

async function getOnChainBatchErc20Balances(
  ethChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getOffChainBatchErc20Balances(
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getErc20Balance(
  rpcEndpoint: string,
  contractAddress: string,
  address: string,
): Promise<Balances> {
  return {};
}
