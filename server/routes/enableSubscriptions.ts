import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body['subscription_ids[]']) {
    return next(new Error('must specifiy subscription ids'));
  }

  // subscription_ids[] comes either as a single string if there's one element, or as an array.
  // We need to handle both cases: in the former, we find the single subscription equal to the
  // one passed. In the latter, we find all subscription rows whose ids are within the provided list.
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
    s.is_active = true;
    return s.save();
  }));

  return res.json({ status: 'Success', result: 'Enabled subscriptions' });
};
