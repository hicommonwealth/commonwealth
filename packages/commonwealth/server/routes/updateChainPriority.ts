import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

enum UpdatePriorityErrors {
  NoChainID = 'No chain_id provided.',
  NoChain = 'Chain not found.',
  Failed = 'Request Failed.',
}

type priorityType = 'prioritize' | 'deprioritize';

type updateChainPriorityReq = {
  secret: string;
  chain_id: string;
  action: priorityType;
};

type updateChainPriorityResp = {
  result: string;
};

const updateChainPriority = async (
  models: DB,
  req: TypedRequestBody<updateChainPriorityReq>,
  res: TypedResponse<updateChainPriorityResp>,
) => {
  // Verify Chain Exists
  const { chain_id, action, secret } = req.body;
  if (!chain_id) throw new AppError(UpdatePriorityErrors.NoChainID);

  const chain = await models.Community.findOne({
    where: { id: chain_id },
  });
  if (!chain) throw new AppError(UpdatePriorityErrors.NoChain);

  if (!process.env.AIRPLANE_SECRET) {
    throw new AppError(UpdatePriorityErrors.Failed);
  }

  // Check secret
  if (process.env.AIRPLANE_SECRET !== secret) {
    throw new AppError(UpdatePriorityErrors.Failed);
  }

  // Update Collapsed on homepage, which is used as a priority flag for sorting
  chain.collapsed_on_homepage = !(action === 'prioritize');
  await chain.save();

  return success(res, { result: 'Updated chain priority.' });
};

export default updateChainPriority;
