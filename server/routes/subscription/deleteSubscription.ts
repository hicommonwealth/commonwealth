import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../util/logging';
import Errors from './errors';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  if (!req.body.subscription_id) {
    return next(new Error(Errors.NoSubscriptionId));
  }

  const subscription = await models.Subscription.findOne({
    where: { id: req.body.subscription_id }
  });
  if (!subscription) {
    return next(new Error(Errors.NoSubscription));
  }
  if (req.user.id !== subscription.subscriber_id) {
    return next(new Error(Errors.NotUsersSubscription));
  }

  // we don't delete all associated notifications -- since Subscriptions is set to paranoid mode,
  // it preserves deleted entries and simply gives them a "deleted_at" value
  await subscription.destroy();
  return res.json({ status: 'Success', result: 'Deleted subscription' });
};
