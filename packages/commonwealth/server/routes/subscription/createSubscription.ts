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
  if (!req.body.category) {
    return next(new AppError(Errors.NoCategory));
  }

  const category = await models.NotificationCategory.findOne({
    where: { name: req.body.category },
  });
  if (!category) {
    return next(new AppError(Errors.InvalidNotificationCategory));
  }

  let obj;
  switch (category.name) {
    case 'new-thread-creation': {
      const chain = await models.Chain.findOne({
        where: {
          id: req.body.chain_id,
        },
      });
      if (!chain) return next(new AppError(Errors.InvalidChain));
      obj = { chain_id: req.body.chain_id };
      break;
    }
    case 'snapshot-proposal': {
      const space = await models.SnapshotSpace.findOne({
        where: {
          snapshot_space: req.body.snapshot_id,
        },
      });
      if (!space) return next(new AppError(Errors.InvalidSnapshotSpace));
      obj = { snapshot_id: req.body.snapshot_id };
      break;
    }
    case 'new-comment-creation':
    case 'new-reaction': {
      if (req.body.thread_id) {
        const thread = await models.Thread.findOne({
          where: { id: req.body.thread_id },
        });
        if (!thread) return next(new AppError(Errors.NoThread));
        obj = { thread_id: req.body.thread_id };
      } else if (req.body.comment_id) {
        const comment = await models.Comment.findOne({
          where: { id: req.body.comment_id },
        });
        if (!comment) return next(new AppError(Errors.NoComment));
        obj = { comment_id: req.body.comment_id };
      }
      break;
    }
    case 'new-mention':
      return next(new AppError(Errors.NoMentions));
    case 'chain-event': {
      const chain = await models.Chain.findOne({
        where: {
          id: req.body.chain_id,
        },
      });
      if (!chain) return next(new AppError(Errors.InvalidChain));
      obj = { chain_id: req.body.chain_id };
      break;
    }
    default:
      return next(new AppError(Errors.InvalidNotificationCategory));
  }

  const subscription = (
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: req.body.category,
      is_active: !!req.body.is_active,
      ...obj,
    })
  ).toJSON();

  return res.json({ status: 'Success', result: subscription });
};
