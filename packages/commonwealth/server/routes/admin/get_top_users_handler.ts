import { GetTopUsersResult } from '../../controllers/server_admin_methods/get_top_users';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type GetTopUsersResponse = GetTopUsersResult;

export const getTopUsersHandler = async (
  controllers: ServerControllers,
  req: TypedRequest,
  res: TypedResponse<GetTopUsersResponse>,
) => {
  const result = await controllers.admin.getTopUsers({
    user: req.user,
  });
  return success(res, result);
};
