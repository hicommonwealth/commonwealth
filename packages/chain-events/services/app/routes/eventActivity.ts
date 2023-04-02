import type { NextFunction, Request, Response } from 'express';
import {AppError, ServerError} from 'common-common/src/errors';

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

  console.log("Starting /eventActivity");
  try {
    const events = await models.ChainEvent.findAll({
      order: [['created_at', 'DESC']],
      limit: req.query.limit,
    });
    console.log("events fetched from db", events);
    return res.json({ status: 'Success', result: events.map((e) => e.toJSON()) });
  } catch (e) {
    console.error(e);
    return next(new ServerError(`Failed to fetch events from DB`, e));
  }


};

export default eventActivity;
