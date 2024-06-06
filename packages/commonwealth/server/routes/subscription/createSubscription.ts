import { AppError } from '@hicommonwealth/core';
import {
  checkSnapshotObjectExists,
  CommentInstance,
  CommunityInstance,
  DB,
  SubscriptionAttributes,
  ThreadInstance,
} from '@hicommonwealth/model';
import { NotificationCategories } from '@hicommonwealth/shared';
import type { NextFunction, Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
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
    community: CommunityInstance,
    thread: ThreadInstance,
    comment: CommentInstance;

  switch (category.name) {
    case NotificationCategories.NewThread: {
      // this check avoids a 500 error -> 'WHERE parameter "id" has invalid "undefined" value'
      if (!req.body.community_id)
        return next(new AppError(Errors.InvalidCommunity));
      // @ts-expect-error StrictNullChecks
      community = await models.Community.findOne({
        where: {
          id: req.body.community_id,
        },
      });
      if (!community) return next(new AppError(Errors.InvalidCommunity));
      obj = { community_id: req.body.community_id };
      break;
    }
    case NotificationCategories.SnapshotProposal: {
      if (!req.body.snapshot_id) {
        return next(new AppError(Errors.InvalidSnapshotSpace));
      }
      const spaceExists = await checkSnapshotObjectExists(
        'space',
        req.body.snapshot_id,
      );
      if (!spaceExists) return next(new AppError(Errors.InvalidSnapshotSpace));
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
        // @ts-expect-error StrictNullChecks
        thread = await models.Thread.findOne({
          where: { id: req.body.thread_id },
        });
        if (!thread) return next(new AppError(Errors.NoThread));
        obj = {
          thread_id: req.body.thread_id,
          community_id: thread.community_id,
        };
      } else if (req.body.comment_id) {
        // @ts-expect-error StrictNullChecks
        comment = await models.Comment.findOne({
          where: { id: req.body.comment_id },
        });
        if (!comment) return next(new AppError(Errors.NoComment));
        obj = {
          comment_id: req.body.comment_id,
          community_id: comment.community_id,
        };
      }
      break;
    }

    case NotificationCategories.NewMention:
      return next(new AppError(Errors.NoMentions));
    case NotificationCategories.NewCollaboration:
      return next(new AppError(Errors.NoCollaborations));
    case NotificationCategories.ChainEvent: {
      if (!req.body.community_id)
        return next(new AppError(Errors.InvalidCommunity));
      // @ts-expect-error StrictNullChecks
      community = await models.Community.findOne({
        where: {
          id: req.body.community_id,
        },
      });
      if (!community) return next(new AppError(Errors.InvalidCommunity));
      obj = { community_id: req.body.community_id };
      break;
    }
  }

  const [subscription] = await models.Subscription.findOrCreate({
    where: {
      subscriber_id: req.user.id,
      category_id: req.body.category,
      is_active: !!req.body.is_active,
      // @ts-expect-error StrictNullChecks
      ...obj,
    },
  });

  const subJson = subscription.toJSON();

  // @ts-expect-error StrictNullChecks
  if (thread) {
    subJson.Thread = thread.toJSON();
  }
  // @ts-expect-error StrictNullChecks
  if (comment) {
    subJson.Comment = comment.toJSON();
  }

  return res.json({ status: 'Success', result: subJson });
};
