import { emailDigestBuilder } from '../scripts/emails';
import type { CommunityDigestInfo } from '../scripts/emails';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';

const runDigestScript = async (
  models: DB,
  req: TypedRequestBody<{ id: string }>,
  res: TypedResponse<{ data: CommunityDigestInfo[] }>
) => {
  const digestInfo = await emailDigestBuilder(models);
  return success(res, { data: digestInfo });
};

export default runDigestScript;
