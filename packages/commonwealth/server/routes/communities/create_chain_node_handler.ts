import { CreateChainNodeResult } from '../../controllers/server_communities_methods/create_chain_node';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateChainNodeRequestBody = {
  url: string;
  name?: string;
  balance_type?: string;
  eth_chain_id?: number;
};
type CreateChainNodeResponse = CreateChainNodeResult;

export const createChainNodeHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateChainNodeRequestBody>,
  res: TypedResponse<CreateChainNodeResponse>,
) => {
  const results = await controllers.communities.createChainNode({
    // @ts-expect-error StrictNullChecks
    user: req.user,
    url: req.body.url,
    name: req.body.name,
    balanceType: req.body.balance_type,
    eth_chain_id: req.body.eth_chain_id,
  });
  return success(res, results);
};
