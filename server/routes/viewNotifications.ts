import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import {DB, sequelize} from '../database';
import {performance, PerformanceObserver} from "perf_hooks";

const Op = Sequelize.Op;
const MAX_NOTIF = 40;

export enum NotificationCategories {
  ChainEvents = "chain-event",
  Discussion = "discussion"
}

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (
    models: DB,
    notificationCategory: NotificationCategories,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
  console.log(req.user);
  performance.mark('start');
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }

  // locate active subscriptions, filter by category if specified
  const searchParams: any[] = [
    { subscriber_id: req.user.id },
  ];
  if (req.body.active_only) {
    searchParams.push({ is_active: true });
  }
  if (req.body.categories && req.body.categories.length) {
    searchParams.push({
      category_id: {
        [Op.contained]: req.body.categories,
      }
    });
  }
  if (req.body.chain_filter) {
    searchParams.push({
      chain_id: req.body.chain_filter,
    });
  }

  const notificationWhereOptions = {}
  if (notificationCategory == NotificationCategories.ChainEvents) {
    notificationWhereOptions['category_id'] = NotificationCategories.ChainEvents
  } else {
    notificationWhereOptions['category_id'] = { [Op.ne]: NotificationCategories.ChainEvents }
  }

  performance.mark('A');
  const numUnread = (<any>(await models.NotificationsRead.count({
    where: {
      [Op.and]: [
        { user_id: req.user.id },
        { is_read: false }
      ]
    }
  })));

  console.log("Number Unread:", numUnread);

  let maxId, numNr;
  // if maxId is not provided that means this is the first request so load the first 100
  // TODO: if this is too slow create a table keeping track of maxId for each user and query that instead (increment the counters in emitNotifications)
  // TODO: or better yet create onUpdate and onDelete triggers to update the counters
  // TODO: should this always run so we can return number of unread or things like that?
  numNr = (<any>(await models.NotificationsRead.findOne({
    attributes: [
      <any>models.sequelize.fn('MAX', models.sequelize.col('id')),
    ],
    where: { user_id: req.user.id },
    raw: true
  }))).max;

  if (!req.body.maxId || req.body.maxId == 0) maxId = numNr;
  else maxId = req.body.maxId;

  performance.mark('B');

  const whereAndOptions: any = [
    {user_id: req.user.id},
    {id: {[Op.lte]: maxId}}
  ]

  console.log(">>>>>>>>>>>>>>>>>Max Id:", maxId);

  if (req.body.unread_only) whereAndOptions.push({ is_read: false });

  // TODO: write raw query so that all subscriptions are included
  const notificationsRead = await models.NotificationsRead.findAll({
    include: [
      {
        model: models.Subscription,
        required: true,
        where: {
          [Op.and]: searchParams
        }
      },
      {
        model: models.Notification,
        required: true,
        where: notificationWhereOptions
      }
    ],
    where: {
      [Op.and]: whereAndOptions
    },
    order: [['id', 'DESC']],
    limit: MAX_NOTIF,
    raw: true, nest: true, logging: true
  });

  performance.mark('C');

  const obs = new PerformanceObserver((list, observer) => {
    console.log(list.getEntriesByType('measure'));
    observer.disconnect();
  });
  obs.observe({ entryTypes: ['measure'], buffered: true });

  performance.measure("measure start to A", 'start', 'A');
  performance.measure("measure A to B", 'A', 'B');
  performance.measure("measure B to C", 'B', 'C');


  // console.log(subscriptions.map((s) => s.toJSON()));
  const subscriptionsObj = {}

  for (const nr of notificationsRead) {
    const chainEvent = JSON.parse(nr.Notification.notification_data);
    if (!subscriptionsObj[nr.subscription_id]) {
      subscriptionsObj[nr.subscription_id] = {
        ChainEventType: chainEvent.ChainEventType,
        NotificationsReads: [], // also contains notifications
        ...nr.Subscription
      }
    }

    // should be able to simply push unwrapped NotificationRead
    subscriptionsObj[nr.subscription_id].NotificationsReads.push({
      id: nr.id,
      is_read: nr.is_read,
      notification_id: nr.notification_id,
      subscription_id: nr.subscription_id,
      Notification: {
        ...nr.Notification,
        ChainEvent: chainEvent
      }
    })
  }

  const subscriptions = []
  for (const sub_id in subscriptionsObj) subscriptions.push(subscriptionsObj[sub_id]);

  return res.json({ status: 'Success', result: {subscriptions, numNotifications: numNr, numUnread} });
};
