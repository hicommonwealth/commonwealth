import { Request, Response, NextFunction } from 'express';
import proposalIdToEntity from '../../util/proposalIdToEntity';
import Errors from './errors';
import { factory, formatFilename } from '../../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export default async (
  models,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.category || req.body.object_id === undefined) {
    return next(new Error(Errors.NoCategoryAndObjectId));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category },
  });
  if (!category) {
    return next(new Error(Errors.InvalidNotificationCategory));
  }

  let obj;
  const parsed_object_id = req.body.object_id.split(/-|_/);
  const p_id = parsed_object_id[1];
  const p_entity = parsed_object_id[0];
  let community;

  switch (category.name) {
    case 'new-thread-creation': {
      community = await models.Community.findOne({
        where: {
          id: p_entity,
        },
      });
      if (community) {
        obj = { community_id: p_entity };
      }
      break;
    }
    case 'new-comment-creation':
    case 'new-reaction': {
      if (p_entity === 'discussion') {
        const thread = await models.Thread.findOne({
          where: { id: Number(p_id) },
        });
        if (!thread) return next(new Error(Errors.NoThread));
        obj = { offchain_thread_id: Number(p_id), community_id: thread.community_id };
      } else if (p_entity === 'comment') {
        const comment = await models.Comment.findOne({
          where: { id: Number(p_id) },
        });
        if (!comment) return next(new Error(Errors.NoComment));
        obj = { offchain_comment_id: Number(p_id), community_id: comment.community_id };
      } else {
        if (!req.body.community_id)
          return next(new Error(Errors.ChainRequiredForEntity));
        const chainEntity = await proposalIdToEntity(
          models,
          req.body.community_id,
          req.body.object_id
        );
        if (!chainEntity) return next(new Error(Errors.NoChainEntity));
        obj = { community_id: chainEntity.community_id, chain_entity_id: chainEntity.id };
      }
      break;
    }
    case 'new-mention':
      return next(new Error(Errors.NoMentions));
    case 'chain-event': {
      community = await models.Community.findOne({
        where: {
          id: p_entity,
        },
      });
      if (!community) return next(new Error(Errors.InvalidChain));
      const chainEventType = await models.ChainEventType.findOne({
        where: {
          id: req.body.object_id,
        },
      });
      if (!chainEventType) return next(new Error(Errors.InvalidChainEventId));
      obj = { community_id: p_entity, chain_event_type_id: req.body.object_id };
      break;
    }
    default:
      return next(new Error(Errors.InvalidNotificationCategory));
  }

  const subscription = await models.Subscription.create({
    subscriber_id: req.user.id,
    category_id: req.body.category,
    object_id: req.body.object_id,
    is_active: !!req.body.is_active,
    ...obj,
  });

  return res.json({ status: 'Success', result: subscription.toJSON() });
};
