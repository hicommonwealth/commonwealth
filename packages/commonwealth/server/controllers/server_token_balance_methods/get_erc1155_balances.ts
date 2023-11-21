import { ChainNodeInstance } from '../../models/chain_node';
import { Balances } from '../server_token_balance_controller';

export type GetErc1155BalancesOptions = {
  chainNode: ChainNodeInstance;
  addresses: string[];
  contractAddress: string;
  tokenId: string;
};

export async function __getErc1155Balances(
  options: GetErc1155BalancesOptions,
) {}

async function getOffChainBatchErc1155Balances(
  rpcEndpoint: string,
  contractAddress: string,
  addresses: string[],
  tokenId: string,
): Promise<Balances> {
  return {};
}
