import { GetChainNodesResult } from 'server/controllers/server_chains_methods/get_chain_nodes';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse, success } from '../../types';

type GetChainNodesRequestParams = {};
type GetChainNodesResponse = GetChainNodesResult;

export const getChainNodesHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetChainNodesRequestParams>,
  res: TypedResponse<GetChainNodesResponse>
) => {
  console.log('testing new eslint CI');
  const testing = (unusedVar: string) => {
    console.log('lol');
  };
  console.log(testing);
  const results = await controllers.chains.getChainNodes({});
  return success(res, results);
};
