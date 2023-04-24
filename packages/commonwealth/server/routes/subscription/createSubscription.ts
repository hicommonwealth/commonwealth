import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../models';
import Errors from './errors';

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.category || req.body.object_id === undefined) {
    return next(new AppError(Errors.NoCategoryAndObjectId));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category },
  });
  if (!category) {
    return next(new AppError(Errors.InvalidNotificationCategory));
  }

  let obj;
  const parsed_object_id = req.body.object_id.split(/-|_/);
  const p_id = parsed_object_id[1];
  const p_entity = parsed_object_id[0];
  let chain;

  switch (category.name) {
    case 'new-thread-creation': {
      chain = await models.Chain.findOne({
        where: {
          id: p_entity,
        },
      });
      if (chain) {
        obj = { chain_id: p_entity };
      }
      break;
    }
    case 'snapshot-proposal': {
      const space = await models.SnapshotSpace.findOne({
        where: {
          snapshot_space: p_entity,
        },
      });
      if (space) {
        obj = { snapshot_id: space.snapshot_space };
      }
      break;
    }
    case 'new-comment-creation':
    case 'new-reaction': {
      if (p_entity === 'discussion') {
        const thread = await models.Thread.findOne({
          where: { id: Number(p_id) },
        });
        if (!thread) return next(new AppError(Errors.NoThread));
        obj = { offchain_thread_id: Number(p_id), chain_id: thread.chain };
      } else if (p_entity === 'comment') {
        const comment = await models.Comment.findOne({
          where: { id: Number(p_id) },
        });
        if (!comment) return next(new AppError(Errors.NoComment));
        obj = { offchain_comment_id: Number(p_id), chain_id: comment.chain };
      }
      break;
    }

    case 'new-mention':
      return next(new AppError(Errors.NoMentions));
    case 'chain-event': {
      chain = await models.Chain.findOne({
        where: {
          id: p_entity,
        },
      });
      if (!chain) return next(new AppError(Errors.InvalidChain));

      // object_id = req.body.object_id = [chain_id]_chainEvents
      obj = { chain_id: p_entity };
      break;
    }
    default:
      return next(new AppError(Errors.InvalidNotificationCategory));
  }

  const subscription = (
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: req.body.category,
      object_id: req.body.object_id,
      is_active: !!req.body.is_active,
      ...obj,
    })
  ).toJSON();

  return res.json({ status: 'Success', result: subscription });
};
