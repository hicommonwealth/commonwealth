/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotificationCategories } from '@hicommonwealth/core';
import { NextFunction, Request, Response } from 'express';
import { DB } from '../models';

const viewChainActivity = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
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
