import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotSiteAdmin: 'Not site admin',
};

const viewChainObjectQueries = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotSiteAdmin));
  }
  const versions = await models.ChainObjectVersion.findAll({
    include: [{
      model: models.ChainObjectQuery,
    }]
  });

  return res.json({ status: 'Success', result: versions.map((v) => v.toJSON()) });
};

export default viewChainObjectQueries;
