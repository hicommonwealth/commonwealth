import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  MutuallyExclusive:
    'Cannot select mutually exclusive offchain threads and proposals only options',
};

const bulkComments = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  if (req.query.offchain_threads_only && req.query.proposals_only) {
    return next(new Error(Errors.MutuallyExclusive));
  }
  const whereOptions: any = {};
  whereOptions.chain = chain.id;
  if (req.query.offchain_threads_only) {
    whereOptions.root_id = { [Op.like]: 'discussion%' };
  } else if (req.query.proposals_only) {
    whereOptions.root_id = { [Op.notLike]: 'discussion%' };
  }
  const comments = await models.OffchainComment.findAll({
    where: whereOptions,
    include: [models.Address, models.OffchainAttachment],
    order: [['created_at', 'DESC']],
  });

  return res.json({
    status: 'Success',
    result: comments.map((c) => c.toJSON()),
  });
};

export default bulkComments;
