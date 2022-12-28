import { Request, Response } from 'express';
import { DB } from '../models';

export const getNotificationCategories = async (
  models: DB,
  req: Request,
  res: Response
) => {
  const notificationCategories = await models.NotificationCategory.findAll();

  return res.json({
    notificationCategories
  });
};