import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { CreateGroupResult } from '../../controllers/server_groups_methods/create_group';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  InvalidTopics: 'Invalid topics',
};

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
  if (!metadata) {
    throw new AppError(Errors.InvalidMetadata);
  }
  if (!requirements) {
    throw new AppError(Errors.InvalidRequirements);
  }
  if (topics) {
    for (const topicId of topics) {
      if (typeof topicId !== 'number') {
        throw new AppError(Errors.InvalidTopics);
      }
    }
  }
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
