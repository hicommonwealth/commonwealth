import { AppError, Requirement, schemas } from '@hicommonwealth/core';
import { GroupAttributes } from '@hicommonwealth/model';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateGroupBody = {
  metadata: z.infer<typeof schemas.entities.GroupMetadata>;
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

  // FIXME: this is the command schema
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

  const [group, analyticsOptions] = await controllers.groups.createGroup({
    user,
    community,
    metadata: metadata as Required<typeof metadata>,
    requirements,
    topics,
  });

  // FIXME: keep for now, but should be a debounced async integration policy that get's triggered by creation events
  // refresh memberships in background
  controllers.groups
    .refreshCommunityMemberships({
      communityId: community.id,
      groupId: group.id,
    })
    .catch(console.error);

  // FIXME: replace with analytics middleware
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, group);
};
