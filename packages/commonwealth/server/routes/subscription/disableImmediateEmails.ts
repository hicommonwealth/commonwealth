import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { sequelize } from '../../database';
import { factory, formatFilename } from 'common-common/src/logging';
import Errors from './errors';
import { AppError, ServerError } from '../../util/errors';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body['subscription_ids[]']) {
    return next(new AppError(Errors.NoSubscriptionId));
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
    return next(new AppError(Errors.NotUsersSubscription));
  }

  await sequelize.transaction(async (t) => {
    await Promise.all(subscriptions.map((s) => {
      s.immediate_email = false;
      return s.save({ transaction: t });
    }));
  });

  return res.json({ status: 'Success', result: 'Disabled Immediate Emails' });
};
