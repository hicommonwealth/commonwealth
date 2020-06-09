import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../../shared/logging';
import Errors from './errors';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

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

  // TODO: transactionalize this
  await Promise.all(subscriptions.map((s) => {
    s.immediate_email = false;
    return s.save();
  }));

  return res.json({ status: 'Success', result: 'Disabled Immediate Emails' });
};
