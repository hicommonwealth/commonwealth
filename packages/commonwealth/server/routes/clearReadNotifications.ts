import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { sequelize } from '../database';
import type { DB } from '../models';

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Not signed in'));
  }

  await sequelize.query(
    `
      DELETE
      FROM "NotificationsRead"
      WHERE subscription_id IN (SELECT id FROM "Subscriptions" WHERE subscriber_id = ?)
        AND is_read = true
	`,
    {
      replacements: [req.user.id],
      type: 'DELETE',
      raw: true,
    }
  );

  return res.json({
    status: 'Success',
    result: 'Cleared read notifications',
  });
};
