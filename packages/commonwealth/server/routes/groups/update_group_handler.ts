import { GroupMetadata } from 'server/models/group';
import z from 'zod';
import { AppError } from '../../../../common-common/src/errors';
import { UpdateGroupResult } from '../../controllers/server_groups_methods/update_group';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';

type UpdateGroupParams = { id: string };
type UpdateGroupBody = {
  metadata: GroupMetadata;
  requirements: Requirement[];
};
type UpdateGroupResponse = UpdateGroupResult;

export const updateGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateGroupBody, null, UpdateGroupParams>,
  res: TypedResponse<UpdateGroupResponse>
) => {
  const { user, address, chain: community } = req;

  const schema = z.object({
    params: z.object({
      id: z.coerce.number(),
    }),
    body: z.object({
      metadata: z
        .object({
          name: z.string(),
          description: z.string(),
          required_requirements: z.number().optional(),
        })
        .optional(),
      requirements: z.array(z.any()).optional(), // validated in controller
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }
  const {
    params: { id: groupId },
    body: { metadata, requirements },
  } = validationResult.data;

  const result = await controllers.groups.updateGroup({
    user,
    community,
    address,
    groupId,
    metadata: metadata as Required<typeof metadata>,
    requirements,
  });

  // refresh memberships in background
  controllers.groups
    .refreshCommunityMemberships({ community })
    .catch(console.error);

  return success(res, result);
};
