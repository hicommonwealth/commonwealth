import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const Op = Sequelize.Op;
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
};

export default async (models: DB, req: Request, res: Response, next: NextFunction) => {
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

  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.and]: searchParams
    },
    include: {
      model: models.NotificationsRead,
      as: 'NotificationsRead',
      where: {
        is_read: !req.body.unread_only
      },
      include: [{
        model: models.Notification,
        required: true,
        as: 'Notifications',
        include: [{
          model: models.ChainEvent,
          required: false,
          as: 'ChainEvent',
          include: [{
            model: models.ChainEventType,
            required: false,
            as: 'ChainEventType',
          }]
        }]
      }]
    }
  })

  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
