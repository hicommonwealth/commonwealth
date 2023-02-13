import type { NextFunction, Request, Response } from 'express';
import { AppError } from 'common-common/src/errors';

import type { DB } from '../../database/database';

export const Errors = {
  NeedLimit: 'Must provide limit to fetch events',
};

const eventActivity: any = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.query.limit) {
    return next(new AppError(Errors.NeedLimit));
  }

  const events = await models.ChainEvent.findAll({
    order: [['created_at', 'DESC']],
    limit: req.query.limit,
  });

  return res.json({ status: 'Success', result: events });
};

export default eventActivity;
