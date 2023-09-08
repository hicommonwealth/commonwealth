import { TypedRequestBody, TypedResponse, success } from '../../types';
import { ServerControllers } from '../../routing/router';
import { RefreshMembershipResult } from '../../controllers/server_groups_methods/refresh_membership';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidTopicId: 'Invalid topic ID',
};

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
  const { topic_id: topicId } = req.body;

  const result = await controllers.groups.refreshMembership({
    user,
    chain,
    address,
    topicId,
  });
  return success(res, result);
};
