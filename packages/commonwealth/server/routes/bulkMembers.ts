import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';
import { AppError, ServerError } from '../util/errors';

const log = factory.getLogger(formatFilename(__filename));
const bulkMembers = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new AppError(error));

  const members = await models.Role.findAll({
    where: { chain_id: chain.id },
    include: [{
      model: models.Address,
      required: true,
    }],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: members.map((p) => p.toJSON()) });
};

export default bulkMembers;
