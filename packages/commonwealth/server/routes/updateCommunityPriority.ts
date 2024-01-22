import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '@hicommonwealth/model';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

enum UpdatePriorityErrors {
  NoCommunityID = 'No community_id provided.',
  NoCommunity = 'Community not found.',
  Failed = 'Request Failed.',
}

type priorityType = 'prioritize' | 'deprioritize';

type updateCommunityPriorityReq = {
  secret: string;
  community_id: string;
  action: priorityType;
};

type updateCommunityPriorityResp = {
  result: string;
};

const updateCommunityPriority = async (
  models: DB,
  req: TypedRequestBody<updateCommunityPriorityReq>,
  res: TypedResponse<updateCommunityPriorityResp>,
) => {
  // Verify Community Exists
  const { community_id, action, secret } = req.body;
  if (!community_id) throw new AppError(UpdatePriorityErrors.NoCommunityID);

  const community = await models.Community.findOne({
    where: { id: community_id },
  });
  if (!community) throw new AppError(UpdatePriorityErrors.NoCommunity);

  if (!process.env.AIRPLANE_SECRET) {
    throw new AppError(UpdatePriorityErrors.Failed);
  }

  // Check secret
  if (process.env.AIRPLANE_SECRET !== secret) {
    throw new AppError(UpdatePriorityErrors.Failed);
  }

  // Update Collapsed on homepage, which is used as a priority flag for sorting
  community.collapsed_on_homepage = !(action === 'prioritize');
  await community.save();

  return success(res, { result: 'Updated community priority.' });
};

export default updateCommunityPriority;
