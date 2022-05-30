import { Request, Response, NextFunction } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));
const bulkMembers = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [community, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  const members = await models.Role.findAll({
    where: { community_id: community.id },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: members.map((p) => p.toJSON()) });
};

export default bulkMembers;
