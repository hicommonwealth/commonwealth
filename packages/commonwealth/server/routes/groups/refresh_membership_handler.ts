import { AppError } from '@hicommonwealth/core';
import z from 'zod';
import { RefreshMembershipResult } from '../../controllers/server_groups_methods/refresh_membership';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type RefreshMembershipBody = {
  topic_id: number;
};
type RefreshMembershipResponse = RefreshMembershipResult;

export const refreshMembershipHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<RefreshMembershipBody>,
  res: TypedResponse<RefreshMembershipResponse>,
) => {
  const { user, address } = req;

  const schema = z.object({
    body: z.object({
      topic_id: z.coerce.number().optional(),
    }),
  });
  const validationResult = schema.safeParse(req);
  if (validationResult.success === false) {
    throw new AppError(JSON.stringify(validationResult.error));
  }

  const {
    body: { topic_id },
  } = validationResult.data;

  const result = await controllers.groups.refreshMembership({
    // @ts-expect-error StrictNullChecks
    user,
    // @ts-expect-error StrictNullChecks
    address,
    // @ts-expect-error StrictNullChecks
    topicId: topic_id,
  });
  return success(res, result);
};
