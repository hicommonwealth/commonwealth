import { ChainNodeInstance } from '../../models/chain_node';
import { Balances } from '../server_token_balance_controller';

export type GetErc721BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
};

export async function __getErc721Balances(options: GetErc721BalancesOptions) {}

async function getOnChainBatchErc721Balances(
  ethChainId: number,
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getOffChainBatchErc721Balances(
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
): Promise<Balances> {
  return {};
}

async function getErc721Balance(
  rpcEndpoint: string,
  contractAddress: string,
  address: string,
): Promise<Balances> {
  return {};
}
