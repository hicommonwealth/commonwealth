import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB} from '../database';

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

  const notificationParams: any = {
    model: models.NotificationsRead,
    required: false,
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

  if (req.body.unread_only) {
    notificationParams.where = { is_read: false };
  }

  // perform the query
  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.and]: searchParams
    },
    include: [
      notificationParams,
      {
        model: models.ChainEventType,
        required: false,
      },
    ],
  });

  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
