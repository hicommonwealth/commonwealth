import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { getActivityFeed } from '../util/activityUtils';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Must be logged in to view user dashboard',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  const { id } = req.user;
  const notificationsWithProfiles = await getActivityFeed(models, id);
  return res.json({ status: 'Success', result: notificationsWithProfiles });
};
