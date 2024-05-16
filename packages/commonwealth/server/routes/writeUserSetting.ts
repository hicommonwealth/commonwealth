import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

const VALID_DIGEST_INTERVALS = [
  'never',
  'weekly',
  'daily',
  'twoweeks',
  'monthly',
];

export const Errors = {
  InvalidUser: 'Invalid user',
  NoKeyValue: 'Must provide key and value',
  InvalidSetting: 'Invalid setting',
};

const writeUserSetting = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { key, value } = req.body;

  if (!req.user) {
    return next(new AppError(Errors.InvalidUser));
  }
  if (!key || !value) {
    return next(new AppError(Errors.NoKeyValue));
  }

  if (key === 'disableRichText' && value === 'true') {
    req.user.disableRichText = true;
    await req.user.save();
  } else if (key === 'disableRichText' && value === 'false') {
    req.user.disableRichText = false;
    await req.user.save();
  } else if (
    key === 'updateEmailInterval' &&
    VALID_DIGEST_INTERVALS.indexOf(value) !== -1
  ) {
    req.user.emailNotificationInterval = value;
    await req.user.save();
  } else if (
    key === 'promotional_emails_enabled' &&
    ['true', 'false'].includes(value)
  ) {
    req.user.promotional_emails_enabled = value === 'true' ? true : false;
    await req.user.save();
  } else {
    return next(new AppError(Errors.InvalidSetting));
  }

  return res.json({ status: 'Success', result: { key, value } });
};

export default writeUserSetting;
