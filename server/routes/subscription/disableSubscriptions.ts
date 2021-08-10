import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import Errors from './errors';
import { sequelize } from '../../database';
import log from '../../../shared/logging';

const Op = Sequelize.Op;

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body['subscription_ids[]']) {
    return next(new Error(Errors.NoSubscriptionId));
  }

  let idOptions;
  if (typeof req.body['subscription_ids[]'] === 'string') {
    idOptions = { [Op.eq]: +req.body['subscription_ids[]'] };
  } else {
    idOptions = { [Op.in]: req.body['subscription_ids[]'].map((n) => +n) };
  }

  const subscriptions = await models.Subscription.findAll({
    where: { id: idOptions }
  });

  if (subscriptions.find((s) => s.subscriber_id !== req.user.id)) {
    return next(new Error(Errors.NotUsersSubscription));
  }

  await sequelize.transaction(async (t) => {
    await Promise.all(subscriptions.map((s) => {
      s.is_active = false;
      return s.save({ transaction: t });
    }));
  });

  return res.json({ status: 'Success', result: 'Disabled subscriptions' });
};
