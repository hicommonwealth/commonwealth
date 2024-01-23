import { AppError } from '@hicommonwealth/adapters';
import type { DB } from '@hicommonwealth/model';
import { sequelize } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
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
    },
  );

  return res.json({
    status: 'Success',
    result: 'Cleared read notifications',
  });
};
