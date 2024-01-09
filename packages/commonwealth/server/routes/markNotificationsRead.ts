import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import { sequelize } from '../database';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoNotificationIds: 'Must specify notification IDs',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body['notification_ids[]']) {
    return next(new AppError(Errors.NoNotificationIds));
  }

  let idOptions;
  if (
    typeof req.body['notification_ids[]'] === 'string' ||
    typeof req.body['notification_ids[]'] === 'number'
  ) {
    idOptions = req.body['notification_ids[]'];
  } else {
    idOptions = req.body['notification_ids[]'].map((n) => +n);
  }

  await sequelize.query(
    `
    UPDATE "NotificationsRead" NR
    SET is_read = true
    FROM "Subscriptions" S
    WHERE is_read = false AND notification_id IN (?) AND subscriber_id = ? AND NR.subscription_id = S.id;
  `,
    { raw: true, type: 'UPDATE', replacements: [idOptions, req.user.id] },
  );

  return res.json({ status: 'Success', result: 'Marked notifications read' });
};
