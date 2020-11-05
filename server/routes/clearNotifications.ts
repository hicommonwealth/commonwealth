import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoNotificationIds: 'Must specify notification IDs',
  WrongOwner: 'Notification not owned by user',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body['notification_ids[]']) {
    return next(new Error(Errors.NoNotificationIds));
  }

  let idOptions;
  if (typeof req.body['notification_ids[]'] === 'string') {
    idOptions = { [Op.eq]: +req.body['notification_ids[]'] };
  } else {
    idOptions = { [Op.in]: req.body['notification_ids[]'].map((n) => +n) };
  }

  const notifications = await models.Notification.findAll({
    where: { id: idOptions },
    include: [ models.Subscription ]
  });

  if (notifications.find((n) => n.Subscription.subscriber_id !== req.user.id)) {
    return next(new Error(Errors.WrongOwner));
  }

  await Promise.all(notifications.map((n) => {
    return n.destroy();
  }));

  return res.json({ status: 'Success', result: 'Cleared notifications' });
};
