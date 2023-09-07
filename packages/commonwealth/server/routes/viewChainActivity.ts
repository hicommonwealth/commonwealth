import { DB } from '../models';
import { NextFunction, Request, Response } from 'express';
import { NotificationCategories } from 'common-common/src/types';

const viewChainActivity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ceNotifs = await models.Notification.findAll({
    where: {
      category_id: NotificationCategories.ChainEvent,
    },
    limit: 50,
    order: [['created_at', 'DESC']],
  });

  return res.json({
    status: 'Success',
    result: ceNotifs.map((n) => JSON.parse(n.toJSON().notification_data)),
  });
};

export default viewChainActivity;
