import type { DB } from '@hicommonwealth/model';
import { GlobalActivityCache } from '@hicommonwealth/model';
import type { TypedRequestBody } from '../types';
import { success } from '../types';

const viewGlobalActivity = async (
  models: DB,
  globalActivityCache: GlobalActivityCache,
  req: TypedRequestBody<Record<string, never>>,
  res,
) => {
  const activity = await globalActivityCache.getGlobalActivity();
  return success(res, activity);
};

export default viewGlobalActivity;
