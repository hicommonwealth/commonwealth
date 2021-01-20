import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (models, req: Request, res: Response, next: NextFunction) => {
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

  // only locate unread notifications if specified
  const notificationParams: any = {
    model: models.Notification,
    as: 'Notifications',
    include: [{
      model: models.ChainEvent,
      required: false,
      as: 'ChainEvent',
      include: [{
        model: models.ChainEventType,
        required: false,
        as: 'ChainEventType',
      }, ],
    }, ]
  };
  if (req.body.unread_only) {
    notificationParams.where = { is_read: false };
  }

  // perform the query
  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.and]: searchParams
    },
    include: [ notificationParams ],
  });

  // TODO: flatten? sort by date?
  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
