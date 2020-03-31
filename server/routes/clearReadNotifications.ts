import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
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

  // TODO: transactionalize this
  await Promise.all(subscriptions.map((s) => {
    return Promise.all(s.Notifications.map((n) => n.destroy()));
  }));

  return res.json({ status: 'Success', result: 'Cleared read notifications' });
};
