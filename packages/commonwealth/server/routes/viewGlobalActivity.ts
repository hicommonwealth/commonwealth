import type { DB } from '@hicommonwealth/model';
import type { GlobalActivity } from 'server/util/activityQuery';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type GlobalActivityCache from '../util/globalActivityCache';

const viewGlobalActivity = async (
  models: DB,
  globalActivityCache: GlobalActivityCache,
  req: TypedRequestBody<Record<string, never>>,
  res: TypedResponse<GlobalActivity>,
) => {
  const activity = await globalActivityCache.getGlobalActivity();
  return success(res, activity);
};

export default viewGlobalActivity;
