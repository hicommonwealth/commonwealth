import { AppError } from '@hicommonwealth/adapters';
import z from 'zod';
import { GroupAttributes, GroupMetadata } from '../../models/group';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';

type CreateGroupBody = {
  metadata: GroupMetadata;
  requirements: Requirement[];
  topics?: number[];
};
type CreateGroupResponse = GroupAttributes;

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

  const [group, analyticsOptions] = await controllers.groups.createGroup({
    user,
    community,
    address,
    metadata: metadata as Required<typeof metadata>,
    requirements,
    topics,
  });

  // refresh memberships in background
  controllers.groups
    .refreshCommunityMemberships({ community, group })
    .catch(console.error);

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, group);
};
