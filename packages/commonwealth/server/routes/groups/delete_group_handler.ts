import { TypedRequestParams, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { DeleteGroupResult } from '../../controllers/server_groups_methods/delete_group';

type DeleteGroupParams = {
  id: string;
};
type DeleteGroupResponse = DeleteGroupResult;

export const deleteGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<DeleteGroupParams>,
  res: TypedResponse<DeleteGroupResponse>
) => {
  const { user, address, chain } = req;

  const { id } = req.params;
  const result = await controllers.groups.deleteGroup({
    user,
    chain,
    address,
    groupId: parseInt(id, 10),
  });
  return success(res, result);
};
