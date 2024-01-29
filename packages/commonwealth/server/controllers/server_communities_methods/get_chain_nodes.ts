import { ChainNodeInstance } from '@hicommonwealth/model';
import { ServerCommunitiesController } from '../server_communities_controller';

export type GetChainNodesOptions = {};
export type GetChainNodesResult = ChainNodeInstance[];

export async function __getChainNodes(
  this: ServerCommunitiesController,
): Promise<GetChainNodesResult> {
  return this.models.ChainNode.findAll();
}
