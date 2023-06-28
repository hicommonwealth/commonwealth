import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import Sequelize, { QueryTypes } from 'sequelize';
import type { DB } from '../../models';
import {
  buildChainEventQuery,
  buildCommentQuery,
  buildReactionQuery,
  buildThreadSnapshotQuery,
  buildUserNotifQuery,
} from './queries';

export enum NotificationCategories {
  ChainEvents = 'chain-event',
  Discussion = 'discussion',
}

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (
  models: DB,
  notificationCategory: NotificationCategories,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  // TODO: add chain_filter
  const user_id_test = 6;

  let notifications;
  if (notificationCategory === NotificationCategories.ChainEvents) {
    let { query, replacements } = buildChainEventQuery(
      req.user.id,
      req.body.chain_filter
    );
    notifications = await models.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements,
    });
  } else {
    // new-mention and new-collaboration notifications
    let result = buildUserNotifQuery(req.user.id, req.body.chain_filter);
    const userNotifPromise = models.sequelize.query(result.query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: result.replacements,
    });

    // new-comment-creation notifications
    result = buildCommentQuery(req.user.id, req.body.chain_filter);
    const commentNotifPromise = models.sequelize.query(result.query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: result.replacements,
    });

    // new-reaction notifications
    result = buildReactionQuery(req.user.id, req.body.chain_filter);
    const reactionNotifPromise = models.sequelize.query(result.query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: result.replacements,
    });

    // new-thread-creation and snapshot-proposal
    result = buildThreadSnapshotQuery(req.user.id, req.body.chain_filter);
    const threadAndSnapshotNotifPromise = models.sequelize.query(result.query, {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: result.replacements,
    });

    const [userNotif, commentNotif, reactionNotif, threadAndSnapshotNotif] =
      await Promise.all([
        userNotifPromise,
        commentNotifPromise,
        reactionNotifPromise,
        threadAndSnapshotNotifPromise,
      ]);

    notifications = [
      ...userNotif,
      ...commentNotif,
      ...reactionNotif,
      ...threadAndSnapshotNotif,
    ]
      .sort(
        (
          a: { created_at: string },
          b: {
            created_at: string;
          }
        ) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      // crude pagination but works as intended to reduce response size (thus decreasing response times)
      .slice(0, 50);
  }

  return res.json({
    status: 'Success',
    result: { notifications },
  });
};
