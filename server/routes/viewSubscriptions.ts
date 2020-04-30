import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  const subscriptions = await models.Subscription.findAll({
    where: { subscriber_id: req.user.id },
  });
  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
