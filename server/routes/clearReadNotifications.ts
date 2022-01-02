import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { sequelize, DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
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
