import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { RefreshMembershipResult } from '../../controllers/server_groups_methods/refresh_membership';
import { AppError } from '../../../../common-common/src/errors';
import z from 'zod';

type RefreshMembershipBody = {
  topic_id: number;
};
type RefreshMembershipResponse = RefreshMembershipResult;

export const refreshMembershipHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<RefreshMembershipBody>,
  res: TypedResponse<RefreshMembershipResponse>
) => {
  const { user, address, chain } = req;

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
    user,
    community: chain,
    address,
    topicId: topic_id,
  });
  return success(res, result);
};
