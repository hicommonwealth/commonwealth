import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '@hicommonwealth/model';
import { sequelize } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NotLoggedIn: 'Not signed in',
  NoNotificationIds: 'Must specify notification IDs',
  WrongOwner: 'Notification not owned by user',
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

  let notification_ids;
  if (typeof req.body['notification_ids[]'] === 'string') {
    notification_ids = [+req.body['notification_ids[]']];
  } else {
    notification_ids = req.body['notification_ids[]'].map((n) => +n);
  }

  await sequelize.query(
    `
      DELETE
      FROM "NotificationsRead"
      WHERE notification_id IN (?)
        AND subscription_id IN (SELECT id FROM "Subscriptions" where subscriber_id = ?)
	`,
    { replacements: [notification_ids, req.user.id] },
  );

  return res.json({
    status: 'Success',
    result: 'Cleared notifications',
  });
};
