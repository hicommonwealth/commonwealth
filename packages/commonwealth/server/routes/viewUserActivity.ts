import { AppError } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { getActivityFeed } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';

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
  const page = parseInt(req.body.page as string, 10) || 1;
  const limit = parseInt(req.body.limit as string, 10) || 20;
  const notificationsWithActivity = await getActivityFeed(
    models,
    id,
    page,
    limit,
  );
  return res.json({ status: 'Success', result: notificationsWithActivity });
};
