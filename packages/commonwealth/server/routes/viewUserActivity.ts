import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Must be logged in to view user dashboard',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  const { id } = req.user;

  /**
   * The CTE gets the thread id and latest/max notification id for all threads and comments in
   * chains (communities) that the user has joined. It also assigns a rank (row number) based on descending order of
   * the max notification ids. More recent notifications will have a higher rank than old notifications:
   * thread_id  max_notification_id    thread_rank
   *  10681,         5645365,               1
   *  10680,         5645362,               2
   */
  const query = `
      WITH ranked_thread_notifs as (SELECT n.thread_id                                 AS thread_id,
                                           MAX(n.id)                                   as mx_not_id,
                                           ROW_NUMBER() OVER (ORDER BY MAX(n.id) DESC) as thread_rank
                                    FROM "Notifications" n
                                    WHERE n.category_id IN ('new-thread-creation', 'new-comment-creation')
                                      AND n.chain_id IN (SELECT a."chain" FROM "Addresses" a WHERE a.user_id = ?)
                                      AND n.thread_id IS NOT NULL
                                    GROUP BY n.thread_id)
      -- this section combines the ranked thread ids from above with comments and reactions in order to
      -- count the number of reactions and comments associated with each thread. It also joins the ranked thread ids
      -- with notifications and threads in order to retrieve notification data and thread view counts respectively
      SELECT nt.thread_id,
             nts.created_at                                as last_activity,
             nts.notification_data,
             nts.category_id,
             MAX(thr.view_count)                           as view_count,
             COUNT(DISTINCT oc.id)                         AS comment_count,
             COUNT(DISTINCT tr.id) + COUNT(DISTINCT cr.id) AS reaction_count
      FROM ranked_thread_notifs nt
               INNER JOIN "Notifications" nts ON nt.mx_not_id = nts.id
               LEFT JOIN "Comments" oc ON nt.thread_id = oc.thread_id
               LEFT JOIN "Reactions" tr ON nt.thread_id = tr.thread_id
               LEFT JOIN "Reactions" cr ON oc.id = cr.comment_id
               LEFT JOIN "Threads" thr ON thr.id = nt.thread_id
      WHERE nt.thread_rank <= 50
      GROUP BY nt.thread_id, nts.created_at, nts.notification_data, nts.category_id
      ORDER BY nts.created_at DESC;
  `;

  const notifications: any = await models.sequelize.query(query, {
    type: 'SELECT',
    raw: true,
    replacements: [id],
  });

  const comments = await models.Comment.scope('excludeAttributes').findAll({
    where: {
      thread_id: notifications.map((n) => n.thread_id),
    },
  });

  const addresses = await models.Address.findAll({
    where: {
      id: comments.map((c) => c.address_id),
    },
  });

  const profiles = await models.Profile.findAll({
    where: {
      id: addresses.map((a) => a.profile_id),
    },
    include: [
      {
        model: models.Address,
      },
    ],
  });

  const notificationsWithProfiles = notifications.map((notification) => {
    const filteredComments = comments.filter(
      (c) => c.thread_id === notification.thread_id
    );
    const notificationProfiles = filteredComments.map((c) => {
      const filteredAddress = addresses.find((a) => a.id === c.address_id);

      return profiles.find((p) => p.id === filteredAddress.profile_id);
    });
    return {
      ...notification,
      commenters: [...new Set(notificationProfiles)],
    };
  });

  return res.json({ status: 'Success', result: notificationsWithProfiles });
};
