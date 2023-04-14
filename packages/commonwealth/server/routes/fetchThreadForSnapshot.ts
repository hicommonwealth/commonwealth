import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  NoThread: 'Cannot find thread',
  InvalidSnapshot: 'InvalidSnapshot ID',
  InvalidChain: 'No chain',
};

const fetchThreadForSnapshot = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { snapshot, chain } = req.query;
  if (!snapshot) return next(new AppError(Errors.InvalidSnapshot));
  if (!chain) return next(new AppError(Errors.InvalidChain));

  const threads = await models.Thread.findAll({
    where: {
      chain: chain,
      snapshot_proposal: snapshot,
    },
  });
  if (threads.length < 1) return res.json({ status: 'Failure' });

  return res.json({
    status: 'Success',
    result: threads.map((thread) => {
      return { id: thread.id, title: thread.title };
    }),
  });
};

export default fetchThreadForSnapshot;
