import { AppError } from '@hicommonwealth/adapters';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../models';
import { getActivityFeed } from '../util/activityQuery';

export const Errors = {
  NotLoggedIn: 'Must be signed in to view user dashboard',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  const { id } = req.user;
  const notificationsWithProfiles = await getActivityFeed(models, id);
  return res.json({ status: 'Success', result: notificationsWithProfiles });
};
