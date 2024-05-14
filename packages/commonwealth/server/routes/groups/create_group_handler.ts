import { AppError } from '@hicommonwealth/core';
import { GroupAttributes } from '@hicommonwealth/model';
import { GroupMetadata } from '@hicommonwealth/schemas';
import { Requirement } from '@hicommonwealth/shared';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateGroupBody = {
  metadata: z.infer<typeof GroupMetadata>;
  requirements: Requirement[];
  topics?: number[];
};
type CreateGroupResponse = GroupAttributes;

export const createGroupHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateGroupBody>,
  res: TypedResponse<CreateGroupResponse>,
) => {
  const { user, community } = req;

  // Warning: this is the command schema
  const schema = z.object({
    body: z.object({
      metadata: z.object({
        name: z.string(),
        description: z.string(),
        required_requirements: z.number().optional(),
      }),
      requirements: z.array(z.any()), // validated in controller
      topics: z.array(z.number()).optional(),
      allowList: z.array(z.number()).default([]),
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }
  const {
    body: { metadata, requirements, topics, allowList },
  } = validationResult.data;

  const [group, analyticsOptions] = await controllers.groups.createGroup({
    user,
    community,
    metadata: metadata as Required<typeof metadata>,
    requirements,
    topics,
    allowList,
  });

  // Warning: keep for now, but should be a debounced async integration policy that get's triggered by creation events
  // refresh memberships in background
  controllers.groups
    .refreshCommunityMemberships({
      communityId: community.id,
      groupId: group.id,
    })
    .catch(console.error);

  // Warning: replace with analytics middleware
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, group);
};
