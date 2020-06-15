import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be admin',
  NoQueryId: 'Must provide query_id',
};

const deleteChainObjectQuery = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }
  if (!req.body.query_id) {
    return next(new Error(Errors.NoQueryId));
  }

  try {
    const query = await models.ChainObjectQuery.findOne({
      where: { id: req.body.query_id, }
    });
    await query.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteChainObjectQuery;
