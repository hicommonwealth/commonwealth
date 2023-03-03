import { digestLevels, emailDigestBuilder } from '../scripts/emails';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';
import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';

const Errors = {
  NotAuthorized: 'Not authorized to run digest script',
  InvalidLevel: 'Invalid digest level',
  EmailFailed: 'Emais failed to send',
};

const runDigestScript = async (
  models: DB,
  req: TypedRequestBody<{ digestLevel: number; secret: string }>,
  res: TypedResponse<{ message: Array<any> }>
) => {
  const { digestLevel, secret } = req.body;

  if (
    !secret ||
    !process.env.EMAIL_DIGEST_SECRET ||
    secret !== process.env.EMAIL_DIGEST_SECRET
  ) {
    throw new AppError(Errors.NotAuthorized);
  }

  if (!digestLevels[digestLevel]) {
    throw new AppError(Errors.InvalidLevel);
  }

  try {
    const emails = await emailDigestBuilder(models, digestLevel);
    return success(res, { message: emails });
  } catch (e) {
    console.error(e);
    throw new AppError(Errors.EmailFailed);
  }
};

export default runDigestScript;
