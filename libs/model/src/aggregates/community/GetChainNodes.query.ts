import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function GetChainNodes(): Query<typeof schemas.GetChainNodes> {
  return {
    ...schemas.GetChainNodes,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { search, limit, page, orderBy, orderDirection } = payload;
    },
  };
}

/*
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetChainNodesResult } from 'server/controllers/server_communities_methods/get_chain_nodes';

type GetChainNodesRequestParams = {};
type GetChainNodesResponse = GetChainNodesResult;

export const getChainNodesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetChainNodesRequestParams>,
  res: TypedResponse<GetChainNodesResponse>
) => {
  const results = await controllers.communities.getChainNodes({});
  return success(res, results);
};

*/

/*
import { ChainNodeInstance } from '@hicommonwealth/model';
import { ServerCommunitiesController } from '../server_communities_controller';

export type GetChainNodesOptions = {};
export type GetChainNodesResult = ChainNodeInstance[];

export async function __getChainNodes(
  this: ServerCommunitiesController,
): Promise<GetChainNodesResult> {
  return this.models.ChainNode.findAll();
}

*/
