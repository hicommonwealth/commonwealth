import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

const getCMNProtocols = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  const protocol = await models.CMNProtocol.findOne({
    where: { active: true, chain: chain.id },
  });

  return res.json({
    status: 'Success',
    result: {
      protocol
    }
  });
};

export default getCMNProtocols;
