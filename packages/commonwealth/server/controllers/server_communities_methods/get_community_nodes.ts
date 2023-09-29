import { ServerCommunitiesController } from '../server_communities_controller';
import { ChainNodeInstance } from 'server/models/chain_node';

export type GetCommunityNodesOptions = {};
export type GetCommunityNodesResult = ChainNodeInstance[];

export async function __getCommunityNodes(
  this: ServerCommunitiesController,
  options: GetCommunityNodesOptions
): Promise<GetCommunityNodesResult> {
  return this.models.ChainNode.findAll();
}
