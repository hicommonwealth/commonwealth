import { emailDigestBuilder } from '../scripts/emails';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';

const runDigestScript = async (
  models: DB,
  req: TypedRequestBody<{ id: string }>,
  res: TypedResponse<{ test: string }>
) => {
  const threads = await emailDigestBuilder(models);
  console.log(threads[1].rows);
  return success(res, { test: 'test' });
};

export default runDigestScript;
