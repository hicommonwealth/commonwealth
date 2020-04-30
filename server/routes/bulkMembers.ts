import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const bulkMembers = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  const members = await models.Role.findAll({
    where: chain ? { chain_id: chain.id } : { offchain_community_id: community.id },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: members.map((p) => p.toJSON()) });
};

export default bulkMembers;
