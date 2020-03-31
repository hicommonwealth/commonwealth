import Sequelize from 'sequelize';
const Op = Sequelize.Op;
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
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
  const includeParams: any = {
    model: models.Notification,
    as: 'Notifications',
  };
  if (req.body.unread_only) {
    includeParams.where = { is_read: false };
  }

  // perform the query
  const subscriptions = await models.Subscription.findAll({
    where: {
      [Op.and]: searchParams
    },
    include: [ includeParams ],
  });

  // TODO: flatten? sort by date?
  return res.json({ status: 'Success', result: subscriptions.map((s) => s.toJSON()) });
};
