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
      requirements: z.array(z.any()).min(1), // validated in controller
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
    // @ts-expect-error StrictNullChecks
    user,
    // @ts-expect-error StrictNullChecks
    community,
    metadata: metadata as Required<typeof metadata>,
    requirements,
    topics,
  });

  // Warning: replace with analytics middleware
  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, group);
};
