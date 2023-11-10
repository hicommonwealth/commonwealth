import { CreateChainNodeResult } from '../../controllers/server_communities_methods/create_chain_node';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateChainNodeRequestBody = {
  url: string;
  name?: string;
  bech32?: string;
  balance_type?: string;
};
type CreateChainNodeResponse = CreateChainNodeResult;

export const createChainNodeHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateChainNodeRequestBody>,
  res: TypedResponse<CreateChainNodeResponse>,
) => {
  const results = await controllers.communities.createChainNode({
    user: req.user,
    url: req.body.url,
    name: req.body.name,
    bech32: req.body.bech32,
    balanceType: req.body.balance_type,
  });
  return success(res, results);
};
