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
  InvalidSetting: 'Invalid setting',
};

const writeUserSetting = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    disable_rich_text,
    promotional_emails_enabled,
    email_notification_interval,
  } = req.body;

  if (!req.user) {
    return next(new AppError(Errors.InvalidUser));
  }

  if (
    !(
      typeof disable_rich_text !== 'boolean' ||
      typeof promotional_emails_enabled !== 'boolean' ||
      email_notification_interval
    )
  ) {
    return next(new AppError(Errors.InvalidSetting));
  }

  if (typeof disable_rich_text === 'boolean') {
    req.user.disableRichText = disable_rich_text;
  }
  if (typeof promotional_emails_enabled === 'boolean') {
    req.user.promotional_emails_enabled = promotional_emails_enabled;
  }
  if (VALID_DIGEST_INTERVALS.includes(email_notification_interval)) {
    req.user.emailNotificationInterval = email_notification_interval;
  }

  await req.user.save();

  return res.json({ status: 'Success', result: { user: req.user } });
};

export default writeUserSetting;
