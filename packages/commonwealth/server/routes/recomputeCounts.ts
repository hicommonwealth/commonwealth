import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { recomputeCounts } from '../util/recomputeCountsQuery';
import type { DB } from '../models';

export const Errors = {
  NotLoggedIn: 'Must be logged in to run recompute query',
  NotAdmin: 'Must be admin to run recompute query',
  RunError: 'Error running recompute query',
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

  if (!req.user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  try {
    await recomputeCounts(models);
    return res.json({ status: 'Success' });
  } catch (e) {
    console.error(e);
    return next(new AppError(Errors.RunError));
  }
};
