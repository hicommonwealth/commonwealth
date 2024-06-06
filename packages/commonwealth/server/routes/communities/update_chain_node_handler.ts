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
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<UpdateChainNodeRequestBody, null, { id: string }>,
  res: TypedResponse<UpdateChainNodeResponse>,
) => {
  // @ts-expect-error StrictNullChecks
  const { id } = req.params;
  const nodeId = parseInt(id, 10) || null;

  const results = await controllers.communities.updateChainNode({
    // @ts-expect-error StrictNullChecks
    id: nodeId,
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    url: req.body.url,
    // @ts-expect-error StrictNullChecks
    name: req.body.name,
    // @ts-expect-error StrictNullChecks
    bech32: req.body.bech32,
    // @ts-expect-error StrictNullChecks
    balanceType: req.body.balance_type,
    // @ts-expect-error StrictNullChecks
    eth_chain_id: req.body.eth_chain_id,
    // @ts-expect-error StrictNullChecks
    cosmos_chain_id: req.body.cosmos_chain_id,
  });
  return success(res, results);
};
