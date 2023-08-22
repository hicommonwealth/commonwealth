import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { recomputeCounts } from '../util/recomputeCountsQuery';
import type { DB } from '../models';

export const Errors = {
  RunError: 'Error running recompute query',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await recomputeCounts(models);
    return res.json({ status: 'Success' });
  } catch (e) {
    console.error(e);
    return next(new AppError(Errors.RunError));
  }
};
