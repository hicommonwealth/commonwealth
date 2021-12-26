import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { sequelize, DB, } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export default async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  const subscriptions = await models.Subscription.findAll({
    where: { subscriber_id: req.user.id },
    include: [{
      model: models.NotificationsRead,
      where: { is_read: true },
      as: 'Notifications',
    }]
  });

  await sequelize.transaction(async (t) => {
    await Promise.all(subscriptions.map(async (s) => {
      return Promise.all((await s.getNotifications()).map((n) => n.destroy({ transaction: t })));
    }));
  });

  return res.json({ status: 'Success', result: 'Cleared read notifications' });
};
