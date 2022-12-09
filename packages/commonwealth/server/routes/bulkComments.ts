import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';
import { AppError, ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  MutuallyExclusive: 'Cannot select mutually exclusive threads and proposals only options',
};

const bulkComments = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  if (req.query.offchain_threads_only && req.query.proposals_only) {
    return next(new AppError(Errors.MutuallyExclusive));
  }
  const whereOptions: any = {};
  whereOptions.chain = chain.id;
  if (req.query.offchain_threads_only) {
    whereOptions.root_id = { [Op.like]: 'discussion%' };
  } else if (req.query.proposals_only) {
    whereOptions.root_id = { [Op.notLike]: 'discussion%' };
  }
  const comments = await models.Comment.findAll({
    where: whereOptions,
    include: [ models.Address, models.Attachment ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: comments.map((c) => c.toJSON()) });
};

export default bulkComments;
