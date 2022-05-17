import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB} from '../database';
import {performance, PerformanceObserver} from "perf_hooks";

const Op = Sequelize.Op;

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
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

  const notificationParams: any = {
    model: models.NotificationsRead,
    where: { user_id: req.user.id },
    required: false, // send subscriptions regardless of whether user has notifications
    include: [
      {
        model: models.Notification,
        required: true,
        include: [
          {
            model: models.ChainEvent,
            required: false,
            as: 'ChainEvent',
          },
        ],
      },
    ],
  };

  performance.mark('A');

  if (req.body.unread_only) {
    notificationParams.where = { is_read: false };
  }

  // perform the query
  // const subscriptions = (await models.Subscription.findAll({
  //   where: {
  //     [Op.and]: searchParams,
  //   },
  //   include: [
  //     notificationParams,
  //     {
  //       model: models.ChainEventType,
  //       required: false,
  //     },
  //   ], logging: true
  // })).map(n => n.toJSON());

  // TODO: add user id to notifications read
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
        include: [{
          model: models.ChainEvent,
          required: false,
          as: 'ChainEvent',
          include: [{
            model: models.ChainEventType,
            required: false
          }]
        }]
      }
    ],
    where: {
      user_id: req.user.id
    },
    raw: true, nest: true, logging: true
  });

  performance.mark('B');

  const obs = new PerformanceObserver((list, observer) => {
    console.log(list.getEntriesByType('measure'));
    observer.disconnect();
  });
  obs.observe({ entryTypes: ['measure'], buffered: true });

  performance.measure("measure start to A", 'start', 'A');
  performance.measure("measure A to B", 'A', 'B');

  // console.log(subscriptions.map((s) => s.toJSON()));
  const subscriptionsObj = {}

  for (const nr of notificationsRead) {
    if (!subscriptionsObj[nr.subscription_id]) {
      subscriptionsObj[nr.subscription_id] = {
        ChainEventType: nr.Notification?.ChainEvent?.ChainEventType,
        NotificationReads: [], // also contains notifications
        ...nr.Subscription
      }
    }

    subscriptionsObj[nr.subscription_id].NotificationReads.push({
      is_read: nr.is_read,
      notification_id: nr.notification_id,
      subscription_id: nr.subscription_id,
      Notification: nr.Notification
    })
  }

  // TODO: lack of toJSON() native call causing issues for front-end recognition of notifications
  const subscriptions = []
  for (const sub_id in subscriptionsObj) subscriptions.push(subscriptionsObj[sub_id]);

  return res.json({ status: 'Success', result: subscriptions });
};
