import type { NextFunction, Request, Response } from 'express';
import { AppError, ServerError } from 'common-common/src/errors';

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

  try {
    // we can order by id since the resulting order is almost exactly the same as when ordered by created_at
    // but ordering by id is much faster due to primary key index
    const events = await models.ChainEvent.findAll({
      order: [['id', 'DESC']],
      limit: req.query.limit,
    });
    return res.json({
      status: 'Success',
      result: events.map((e) => e.toJSON()),
    });
  } catch (e) {
    console.error(e);
    return next(new ServerError(`Failed to fetch events from DB`, e));
  }
};

export default eventActivity;
