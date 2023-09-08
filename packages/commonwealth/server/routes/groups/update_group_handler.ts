import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { UpdateGroupResult } from '../../controllers/server_groups_methods/update_group';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
};

type UpdateGroupBody = {
  metadata: any; // TODO: use proper type
  requirements: Requirement[];
};
type UpdateGroupResponse = UpdateGroupResult;

export const updateGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateGroupBody>,
  res: TypedResponse<UpdateGroupResponse>
) => {
  const { user, address, chain } = req;
  const { metadata, requirements } = req.body;
  if (requirements || !validateRequirements(requirements)) {
    throw new AppError(Errors.InvalidRequirements);
  }
  const result = await controllers.groups.updateGroup({
    user,
    chain,
    address,
    metadata,
    requirements,
  });
  return success(res, result);
};
