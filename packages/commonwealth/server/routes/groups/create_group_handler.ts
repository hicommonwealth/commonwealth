import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CreateGroupResult } from 'server/controllers/server_groups_methods/create_group';
import { Requirement } from 'server/util/requirementsModule/requirementsTypes';

type CreateGroupBody = {
  metadata: any; // TODO: use proper type
  requirements: Requirement[];
  topics: number[];
};
type CreateGroupResponse = CreateGroupResult;

export const createGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateGroupBody>,
  res: TypedResponse<CreateGroupResponse>
) => {
  const { user, address, chain } = req;
  const { metadata, requirements, topics } = req.body;
  const result = await controllers.groups.createGroup({
    user,
    chain,
    address,
    metadata,
    requirements,
    topics,
  });
  return success(res, result);
};
