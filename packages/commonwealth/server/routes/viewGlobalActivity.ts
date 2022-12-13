import { TypedRequestBody, TypedResponse, success } from '../types';
import { DB } from '../models';
import { GlobalActivity } from '../util/queryGlobalActivity';
import GlobalActivityCache from '../util/globalActivityCache';

const viewGlobalActivity = async (
  models: DB,
  globalActivityCache: GlobalActivityCache,
  req: TypedRequestBody<Record<string, never>>,
  res: TypedResponse<GlobalActivity>,
) => {
  const activity = await globalActivityCache.globalActivity();
  return success(res, activity);
};

export default viewGlobalActivity;
