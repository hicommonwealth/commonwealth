import type { DB } from '../models';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

export const Errors = {
  MutuallyExclusive:
    'Cannot select mutually exclusive threads and proposals only options',
};

const bulkComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;

  if (req.query.offchain_threads_only && req.query.proposals_only) {
    return next(new AppError(Errors.MutuallyExclusive));
  }
  const whereOptions: any = {};
  whereOptions.chain = chain.id;
  const comments = await models.Comment.findAll({
    where: whereOptions,
    include: [models.Address, models.Attachment],
    order: [['created_at', 'DESC']],
  });

  return res.json({
    status: 'Success',
    result: comments.map((c) => c.toJSON()),
  });
};

export default bulkComments;
