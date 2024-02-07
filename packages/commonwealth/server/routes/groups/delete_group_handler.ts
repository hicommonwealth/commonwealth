import { DeleteGroupResult } from '../../controllers/server_groups_methods/delete_group';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

type DeleteGroupParams = {
  id: string;
};
type DeleteGroupResponse = DeleteGroupResult;

export const deleteGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteGroupParams>,
  res: TypedResponse<DeleteGroupResponse>,
) => {
  const { user, address } = req;

  const { id } = req.params;
  const result = await controllers.groups.deleteGroup({
    user,
    address,
    groupId: parseInt(id, 10),
  });
  return success(res, result);
};
