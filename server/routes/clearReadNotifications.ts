import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../database';
import { factory, formatFilename } from '../../shared/logging';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  const subscriptions = await models.Subscription.findAll({
    where: { subscriber_id: req.user.id },
    include: [{
      model: models.Notification,
      where: { is_read: true },
      as: 'Notifications',
    }]
  });

  await sequelize.transaction(async (t) => {
    await Promise.all(subscriptions.map((s) => {
      return Promise.all(s.Notifications.map((n) => n.destroy({ transaction: t })));
    }));
  });

  return res.json({ status: 'Success', result: 'Cleared read notifications' });
};
