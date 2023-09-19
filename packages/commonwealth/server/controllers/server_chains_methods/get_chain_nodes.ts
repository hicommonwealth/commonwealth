import { ServerChainsController } from '../server_chains_controller';
import { ChainNodeInstance } from 'server/models/chain_node';

export type GetChainNodesOptions = {};
export type GetChainNodesResult = ChainNodeInstance[];

export async function __getChainNodes(
  this: ServerChainsController,
  options: GetChainNodesOptions
): Promise<GetChainNodesResult> {
  return this.models.ChainNode.findAll();
}
