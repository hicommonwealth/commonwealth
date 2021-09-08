import { Op } from 'sequelize';
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

const getTokenDetails = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  const tokenAddresses = req.query.tokenAddresses;

  const tokens = await models.Token.findAll({
    where: {
      address: {
        [Op.in]: tokenAddresses,
      },
      chain: chain.id,
    },
  });

  return res.json({
    status: 'Success',
    result: {
      tokens
    }
  });
};

export default getTokenDetails;
