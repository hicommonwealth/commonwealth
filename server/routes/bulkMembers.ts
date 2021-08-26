import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));
const bulkMembers = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  const total = await models.Role.count({
    where: chain ? { chain_id: chain.id } : { offchain_community_id: community.id },
  });

  const members = await models.Role.findAll({
    where: chain ? { chain_id: chain.id } : { offchain_community_id: community.id },
    include: [ models.Address ],
    order: [[{ model: models.Address, as: 'Address' }, 'last_active', 'DESC NULLS LAST']],
    offset: req.query.itemsPerPage && req.query.pageNum
      ? req.query.itemsPerPage * req.query.pageNum
      : undefined,
    limit: req.query.itemsPerPage,
  });

  return res.json({ status: 'Success', total, result: members.map((p) => p.toJSON()) });
};

export default bulkMembers;
