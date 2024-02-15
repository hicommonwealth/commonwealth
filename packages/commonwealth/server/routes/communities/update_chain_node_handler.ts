import { UpdateChainNodeResult } from '../../controllers/server_communities_methods/update_chain_node';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type UpdateChainNodeRequestBody = {
  url: string;
  name?: string;
  bech32?: string;
  balance_type?: string;
  eth_chain_id?: number;
  cosmos_chain_id?: string;
};
type UpdateChainNodeResponse = UpdateChainNodeResult;

export const updateChainNodeHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateChainNodeRequestBody, null, { id: string }>,
  res: TypedResponse<UpdateChainNodeResponse>,
) => {
  const { id } = req.params;
  const nodeId = parseInt(id, 10) || null;

  const results = await controllers.communities.updateChainNode({
    id: nodeId,
    user: req.user,
    url: req.body.url,
    name: req.body.name,
    bech32: req.body.bech32,
    balanceType: req.body.balance_type,
    eth_chain_id: req.body.eth_chain_id,
    cosmos_chain_id: req.body.cosmos_chain_id,
  });
  return success(res, results);
};
