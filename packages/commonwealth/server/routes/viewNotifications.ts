import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import Sequelize from 'sequelize';
import type { DB } from '../models';

const Op = Sequelize.Op;
const MAX_NOTIF = 40;

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

  // locate active subscriptions, filter by category if specified
  const searchParams: any[] = [{ subscriber_id: req.user.id }];
  if (req.body.active_only) {
    searchParams.push({ is_active: true });
  }
  if (req.body.categories && req.body.categories.length) {
    searchParams.push({
      category_id: {
        [Op.contained]: req.body.categories,
      },
    });
  }
  if (req.body.chain_filter) {
    searchParams.push({
      chain_id: req.body.chain_filter,
    });
  }

  const notificationWhereOptions = {};
  if (notificationCategory === NotificationCategories.ChainEvents) {
    notificationWhereOptions['category_id'] =
      NotificationCategories.ChainEvents;
  } else {
    notificationWhereOptions['category_id'] = {
      [Op.ne]: NotificationCategories.ChainEvents,
    };
  }

  const numUnread = <any>await models.NotificationsRead.count({
    where: {
      [Op.and]: [{ user_id: req.user.id }, { is_read: false }],
    },
  });

  let maxId;
  // if maxId is not provided that means this is the first request so load the first 100
  // TODO: if this is too slow create a table keeping track of maxId for each user and query that instead
  //  (increment the counters in emitNotifications)
  // TODO: or better yet create onUpdate and onDelete triggers to update the counters
  // TODO: should this always run so we can return number of unread or things like that?
  const nmrObj = await models.User.findOne({
    where: { id: req.user.id },
    attributes: ['max_notif_offset'],
  });
  const numNr = nmrObj ? nmrObj.max_notif_offset : 0;
  maxId = numNr;

  if (!req.body.maxId || req.body.maxId === 0) maxId = numNr;
  else maxId = req.body.maxId;

  const whereAndOptions: any = [
    { user_id: req.user.id },
    { id: { [Op.lte]: maxId } },
  ];

  if (req.body.unread_only) whereAndOptions.push({ is_read: false });

  // TODO: write raw query so that all subscriptions are included
  const notificationsRead = await models.NotificationsRead.findAll({
    include: [
      {
        model: models.Subscription,
        required: true,
        where: {
          [Op.and]: searchParams,
        },
      },
      {
        model: models.Notification,
        required: true,
        where: notificationWhereOptions,
      },
    ],
    where: {
      [Op.and]: whereAndOptions,
    },
    order: [['id', 'DESC']],
    limit: MAX_NOTIF,
    raw: true,
    nest: true,
  });

  const subscriptionsObj = {};

  for (const nr of notificationsRead) {
    let chainEvent;
    // if the Notification instance defines a chain_event_id then this is a chain-event notification so parse it
    if (nr.Notification.chain_event_id) {
      chainEvent = JSON.parse(nr.Notification.notification_data);
    }

    // creates an object for each subscription for which we have a NotificationsRead instance.
    // this object will store all the NotificationsRead, Notification, and ChainEvent instances associated with
    // a specific subscription
    if (!subscriptionsObj[nr.subscription_id]) {
      subscriptionsObj[nr.subscription_id] = {
        NotificationsReads: [], // also contains notifications
        ...nr.Subscription,
      };
    }

    // push the NotificationsRead + Notifications data to the NotificationsRead array for each subscription
    subscriptionsObj[nr.subscription_id].NotificationsReads.push({
      id: nr.id,
      is_read: nr.is_read,
      notification_id: nr.notification_id,
      subscription_id: nr.subscription_id,
      Notification: {
        ...nr.Notification,
        ChainEvent: chainEvent,
      },
    });
  }

  // convert the object to an array which is what the front-end expects
  const subscriptions = [];
  for (const sub_id in subscriptionsObj) {
    if (subscriptionsObj[sub_id]) {
      subscriptions.push(subscriptionsObj[sub_id]);
    }
  }

  return res.json({
    status: 'Success',
    result: { subscriptions, numNotifications: numNr, numUnread },
  });
};
