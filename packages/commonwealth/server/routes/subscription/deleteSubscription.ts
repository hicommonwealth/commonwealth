import { NotificationCategories } from '@hicommonwealth/core';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import Errors from './errors';

export default async (
  models,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  if (!req.body.subscription_id) {
    return next(new AppError(Errors.NoSubscriptionId));
  }

  const subscription = await models.Subscription.findOne({
    where: { id: req.body.subscription_id },
  });
  if (!subscription) {
    return next(new AppError(Errors.NoSubscription));
  }
  if (req.user.id !== subscription.subscriber_id) {
    return next(new AppError(Errors.NotUsersSubscription));
  }
  if (subscription.category_id === NotificationCategories.NewMention) {
    return next(new AppError(Errors.NoMentionDelete));
  }

  // we don't delete all associated notifications -- since Subscriptions is set to paranoid mode,
  // it preserves deleted entries and simply gives them a "deleted_at" value
  await subscription.destroy();
  return res.json({ status: 'Success', result: 'Deleted subscription' });
};
