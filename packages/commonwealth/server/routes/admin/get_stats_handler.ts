import { GetStatsResult } from '../../controllers/server_admin_methods/get_stats';
import { ServerControllers } from '../../routing/router';
import { TypedRequestQuery, TypedResponse, success } from '../../types';

type GetStatsRequestQuery = {
  community_id: string;
};
type GetStatsResponse = GetStatsResult;

export const getStatsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetStatsRequestQuery>,
  res: TypedResponse<GetStatsResponse>,
) => {
  const stats = await controllers.admin.getStats({
    user: req.user,
    communityId: req.query.community_id,
  });
  return success(res, stats);
};
