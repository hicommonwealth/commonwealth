import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NoThreadId: 'Must provide thread_id',
};

const getPolls = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { thread_id } = req.query;
  if (!thread_id) return next(new AppError(Errors.NoThreadId));

  const polls = await models.Poll.findAll({
    where: { thread_id },
    include: { model: models.Vote, as: 'votes' },
  });

  return res.json({
    status: 'Success',
    result: polls.map((poll) => poll.toJSON()),
  });
};

export default getPolls;
