/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotificationCategories } from '@hicommonwealth/core';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { SubscriptionAttributes } from 'server/models/subscription';
import type { DB } from '../../models';
import { CommentInstance } from '../../models/comment';
import { CommunityInstance } from '../../models/community';
import { ThreadInstance } from '../../models/thread';
import { supportedSubscriptionCategories } from '../../util/subscriptionMapping';
import Errors from './errors';

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
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

  let obj: WhereOptions<SubscriptionAttributes>,
    chain: CommunityInstance,
    thread: ThreadInstance,
    comment: CommentInstance;

  switch (category.name) {
    case NotificationCategories.NewThread: {
      // this check avoids a 500 error -> 'WHERE parameter "id" has invalid "undefined" value'
      if (!req.body.chain_id) return next(new AppError(Errors.InvalidChain));
      chain = await models.Community.findOne({
        where: {
          id: req.body.chain_id,
        },
      });
      if (!chain) return next(new AppError(Errors.InvalidChain));
      obj = { chain_id: req.body.chain_id };
      break;
    }
    case NotificationCategories.SnapshotProposal: {
      if (!req.body.snapshot_id) {
        return next(new AppError(Errors.InvalidSnapshotSpace));
      }
      const space = await models.SnapshotSpace.findOne({
        where: {
          snapshot_space: req.body.snapshot_id,
        },
      });
      if (!space) return next(new AppError(Errors.InvalidSnapshotSpace));
      obj = { snapshot_id: req.body.snapshot_id };
      break;
    }
    case NotificationCategories.NewComment:
    case NotificationCategories.NewReaction: {
      if (!req.body.thread_id && !req.body.comment_id) {
        return next(new AppError(Errors.NoThreadOrComment));
      } else if (req.body.thread_id && req.body.comment_id) {
        return next(new AppError(Errors.BothThreadAndComment));
      }

      if (req.body.thread_id) {
        thread = await models.Thread.findOne({
          where: { id: req.body.thread_id },
        });
        if (!thread) return next(new AppError(Errors.NoThread));
        obj = { thread_id: req.body.thread_id, chain_id: thread.chain };
      } else if (req.body.comment_id) {
        comment = await models.Comment.findOne({
          where: { id: req.body.comment_id },
        });
        if (!comment) return next(new AppError(Errors.NoComment));
        obj = {
          comment_id: req.body.comment_id,
          chain_id: comment.community_id,
        };
      }
      break;
    }

    case NotificationCategories.NewMention:
      return next(new AppError(Errors.NoMentions));
    case NotificationCategories.NewCollaboration:
      return next(new AppError(Errors.NoCollaborations));
    case NotificationCategories.ChainEvent: {
      if (!req.body.chain_id) return next(new AppError(Errors.InvalidChain));

      chain = await models.Community.findOne({
        where: {
          id: req.body.chain_id,
        },
      });
      if (!chain) return next(new AppError(Errors.InvalidChain));
      obj = { chain_id: req.body.chain_id };
      break;
    }
  }

  const [subscription, created] = await models.Subscription.findOrCreate({
    where: {
      subscriber_id: req.user.id,
      category_id: req.body.category,
      is_active: !!req.body.is_active,
      ...obj,
    },
  });

  const subJson = subscription.toJSON();

  if (chain) {
    subJson.Chain = chain.toJSON();
  }
  if (thread) {
    subJson.Thread = thread.toJSON();
  }
  if (comment) {
    subJson.Comment = comment.toJSON();
  }

  return res.json({ status: 'Success', result: subJson });
};
