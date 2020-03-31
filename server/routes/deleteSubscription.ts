import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  if (!req.body.subscription_id) {
    return next(new Error('must provide subscription id'));
  }

  const subscription = await models.Subscription.findOne({
    where: { id: req.body.subscription_id }
  });
  if (!subscription) {
    return next(new Error('subscription not found'));
  }
  if (req.user.id !== subscription.subscriber_id) {
    return next(new Error('subscription does not belong to user'));
  }

  // we don't delete all associated notifications -- since Subscriptions is set to paranoid mode,
  // it preserves deleted entries and simply gives them a "deleted_at" value
  await subscription.destroy();
  return res.json({ status: 'Success', result: 'Deleted subscription' });
};
