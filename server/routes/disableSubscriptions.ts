import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body['subscription_ids[]']) {
    return next(new Error('must specifiy subscription ids'));
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
    return next(new Error('subscription id is not owned by user'));
  }

  // TODO: transactionalize this
  await Promise.all(subscriptions.map((s) => {
    s.is_active = false;
    return s.save();
  }));

  return res.json({ status: 'Success', result: 'Disabled subscriptions' });
};
