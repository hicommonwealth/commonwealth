import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.category || req.body.object_id === undefined) {
    return next(new Error('Must provide category and object id'));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category }
  });
  if (!category) {
    return next(new Error('invalid notification category'));
  }

  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: req.body.category,
    object_id: req.body.object_id,
    is_active: !!req.body.is_active,
  });

  return res.json({ status: 'Success', result: subscription.toJSON() });
};
