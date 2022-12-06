import { NextFunction, Request, Response } from 'express';
import { DB } from '../../database/database';
import { AppError } from 'common-common/src/errors';

export const Errors = {
  NeedLimit: 'Must provide limit to fetch events',
};

const eventActivity = async (
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
    limit: req.query.limit
  });

  return res.json({ status: 'Success', result: events });
};

export default eventActivity;
