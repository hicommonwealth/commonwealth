import { Request, Response, NextFunction } from 'express';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.category || req.body.object_id === undefined) {
    return next(new Error(Errors.NoCategoryAndObjectId));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category }
  });
  if (!category) {
    return next(new Error(Errors.InvalidNotificationCategory));
  }

  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: req.body.category,
    object_id: req.body.object_id,
    is_active: !!req.body.is_active,
    chain_id: req.body.chain_id || null,
    community_id: req.body.community_id || null,
    offchain_thread_id: Number(req.body.offchain_thread_id) || null,
    offchain_comment_id: Number(req.body.offchain_comment_id) || null,
    chain_event_type_id: req.body.chain_event_type_id || null,
    chain_entity_id: req.body.chain_event_type_id || null,
  });

  return res.json({ status: 'Success', result: subscription.toJSON() });
};
