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
  req: TypedRequestBody<{
    digestLevel: number;
    secret: string;
    confirmationEmail: string;
  }>,
  res: TypedResponse<{ message: string }>
) => {
  const { digestLevel, secret, confirmationEmail } = req.body;

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
    emailDigestBuilder(models, digestLevel, confirmationEmail);
    return success(res, {
      message:
        'Kicked off email digest. You will receive an email when the emails have been sent. Check spam if you do not see it initially.',
    });
  } catch (e) {
    console.error(e);
    throw new AppError(Errors.EmailFailed);
  }
};

export default runDigestScript;
