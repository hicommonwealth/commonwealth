import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const viewChainObjectQueries = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  const versions = await models.ChainObjectVersion.findAll({
    include: [{
      model: models.ChainObjectQuery,
    }]
  });

  return res.json({ status: 'Success', result: versions.map((v) => v.toJSON()) });
};

export default viewChainObjectQueries;
