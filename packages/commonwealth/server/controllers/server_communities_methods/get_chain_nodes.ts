import { ServerCommunitiesController } from '../server_communities_controller';
import { ChainNodeInstance } from 'server/models/chain_node';

export type GetChainNodesOptions = {};
export type GetChainNodesResult = ChainNodeInstance[];

export async function __getChainNodes(
  this: ServerCommunitiesController,
  options: GetChainNodesOptions
): Promise<GetChainNodesResult> {
  return this.models.ChainNode.findAll();
}
