import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body['notification_ids[]']) {
    return next(new Error('must specifiy notification ids'));
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
    return next(new Error('notification not owned by user'));
  }

  // TODO: transactionalize this
  await Promise.all(notifications.map((n) => {
    n.is_read = true;
    return n.save();
  }));

  return res.json({ status: 'Success', result: 'Marked notifications read' });
};
