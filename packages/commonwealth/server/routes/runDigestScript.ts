import { emailDigestBuilder } from '../scripts/emails';
import type { CommunityDigestInfo } from '../scripts/emails';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';

const runDigestScript = async (
  models: DB,
  req: TypedRequestBody<{ digestLevel: number }>,
  res: TypedResponse<{ data: Array<any> }>
) => {
  const { digestLevel } = req.body;
  const digestInfo = await emailDigestBuilder(models, digestLevel);
  return success(res, { data: digestInfo });
};

export default runDigestScript;
