import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../models';
import Errors from './errors';
import { ChainInstance } from 'server/models/chain';
import { supportedSubscriptionCategories } from '../../util/subscriptionMapping';

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

  if (!supportedSubscriptionCategories().includes(category.name)) {
    return next(new AppError(Errors.InvalidSubscriptionCategory));
  }

  let obj, chain: ChainInstance, thread, comment;

  switch (category.name) {
    case 'new-thread-creation': {
      // this check avoids a 500 error -> 'WHERE parameter "id" has invalid "undefined" value'
      if (!req.body.chain_id) return next(new AppError(Errors.InvalidChain));
      chain = await models.Chain.findOne({
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
        thread = await models.Thread.findOne({
          where: { id: req.body.thread_id },
        });
        if (!thread) return next(new AppError(Errors.NoThread));
        obj = { thread_id: req.body.thread_id };
      } else if (req.body.comment_id) {
        comment = await models.Comment.findOne({
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
      chain = await models.Chain.findOne({
        where: {
          id: req.body.chain_id,
        },
      });
      if (!chain) return next(new AppError(Errors.InvalidChain));
      obj = { chain_id: req.body.chain_id };
      break;
    }
  }

  const subscription = (
    await models.Subscription.create({
      subscriber_id: req.user.id,
      category_id: req.body.category,
      is_active: !!req.body.is_active,
      ...obj,
    })
  ).toJSON();

  if (chain) {
    subscription.Chain = chain.toJSON();
  }
  if (thread) {
    subscription.Thread = thread.toJSON();
  }
  if (comment) {
    subscription.Comment = thread.toJSON();
  }

  return res.json({ status: 'Success', result: subscription });
};
