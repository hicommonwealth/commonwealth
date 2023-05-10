import type { DB } from '../models';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import { default as queryGlobalActivity, GlobalActivity } from '../util/queryGlobalActivity';

const viewGlobalActivity = async (
  models: DB,
  req: TypedRequestBody<Record<string, never>>,
  res: TypedResponse<GlobalActivity>
) => {
  const activity = await queryGlobalActivity(models);
  return success(res, activity);
};

export default viewGlobalActivity;
