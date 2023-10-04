import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CreateCommunityNodeResult } from '../../controllers/server_communities_methods/create_community_node';

type CreateCommunityNodeRequestBody = {
  url: string;
  name?: string;
  bech32?: string;
  balance_type?: string;
};
type CreateCommunityNodeResponse = CreateCommunityNodeResult;

export const createCommunityNodeHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateCommunityNodeRequestBody>,
  res: TypedResponse<CreateCommunityNodeResponse>
) => {
  const results = await controllers.communities.createCommunityNode({
    user: req.user,
    url: req.body.url,
    name: req.body.name,
    bech32: req.body.bech32,
    balanceType: req.body.balance_type,
  });
  return success(res, results);
};
