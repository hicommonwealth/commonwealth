import { AppError } from '@hicommonwealth/adapters';
import { Requirement } from '@hicommonwealth/core';
import { GroupAttributes, GroupMetadata } from 'server/models/group';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type UpdateGroupParams = { id: string };
type UpdateGroupBody = {
  metadata: GroupMetadata;
  requirements: Requirement[];
  topics?: number[];
};
type UpdateGroupResponse = GroupAttributes;

export const updateGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateGroupBody, null, UpdateGroupParams>,
  res: TypedResponse<UpdateGroupResponse>,
) => {
  const { user, address, community } = req;

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
      topics: z.array(z.number()).optional(),
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }
  const {
    params: { id: groupId },
    body: { metadata, requirements, topics },
  } = validationResult.data;

  const [group, analyticsOptions] = await controllers.groups.updateGroup({
    user,
    community,
    address,
    groupId,
    metadata: metadata as Required<typeof metadata>,
    requirements,
    topics,
  });

  // refresh memberships in background if requirements updated
  if (requirements?.length > 0) {
    controllers.groups
      .refreshCommunityMemberships({ community, group })
      .catch(console.error);
  }

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, group);
};
