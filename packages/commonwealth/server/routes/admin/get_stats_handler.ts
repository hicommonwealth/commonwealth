import { GetStatsResult } from '../../controllers/server_admin_methods/get_stats';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

type GetStatsRequestParams = {
  communityId: string;
};
type GetStatsResponse = GetStatsResult;

export const getStatsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<GetStatsRequestParams>,
  res: TypedResponse<GetStatsResponse>,
) => {
  const stats = await controllers.admin.getStats({
    user: req.user,
    communityId: req.params.communityId,
  });
  return success(res, stats);
};
