import z from 'zod';
import { AppError } from '../../../../common-common/src/errors';
import { CreateGroupResult } from '../../controllers/server_groups_methods/create_group';
import { GroupMetadata } from '../../models/group';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';

type CreateGroupBody = {
  metadata: GroupMetadata;
  requirements: Requirement[];
  topics?: number[];
};
type CreateGroupResponse = CreateGroupResult;

export const createGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateGroupBody>,
  res: TypedResponse<CreateGroupResponse>,
) => {
  const { user, address, chain: community } = req;

  const schema = z.object({
    body: z.object({
      metadata: z.object({
        name: z.string(),
        description: z.string(),
        required_requirements: z.number().optional(),
      }),
      requirements: z.array(z.any()), // validated in controller
      topics: z.array(z.number()).optional(),
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }
  const {
    body: { metadata, requirements, topics },
  } = validationResult.data;

  const result = await controllers.groups.createGroup({
    user,
    community,
    address,
    metadata: metadata as Required<typeof metadata>,
    requirements,
    topics,
  });

  // refresh memberships in background
  controllers.groups
    .refreshCommunityMemberships({ community })
    .catch(console.error);

  return success(res, result);
};
