import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { GetGroupsResult } from 'server/controllers/server_groups_methods/get_groups';

type GetGroupsQueryQuery = {
  members?: string;
  address?: string;
};
type GetGroupsResponse = GetGroupsResult;

export const getGroupsHandler = async (
  controllers: ServerControllers,
  req: TypedRequestQuery<GetGroupsQueryQuery>,
  res: TypedResponse<GetGroupsResponse>
) => {
  const { members, address } = req.query;
  const result = await controllers.groups.getGroups({
    withMembers: members === 'true',
    address,
  });
  return success(res, result);
};
