import Sequelize from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import { DB} from '../database';

const Op = Sequelize.Op;

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotifyUserNonExist: 'Notification account not found.'
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

  // get the fake user's data from the User model
  const notifyUser = await models.User.findOne({
    where: 
      {
        email: 'notifications@commonwealth.im'
      },
  });

  if(!notifyUser){
    return next(new Error(Errors.NotifyUserNonExist));
  }

  // locate active subscriptions, filter by category if specified
  const userSearchParams: any[] = [{ subscriber_id: req.user.id }];
  if (req.body.active_only) {
    userSearchParams.push({ is_active: true });
  }
  if (req.body.categories && req.body.categories.length) {
    userSearchParams.push({
      category_id: {
        [Op.contained]: req.body.categories,
      },
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
      [Op.or]: [
        { [Op.and]: userSearchParams },
      ]
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
