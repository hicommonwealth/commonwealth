import { Request, Response, NextFunction } from 'express';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const deleteChainObjectQuery = async (models, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.user.isAdmin) {
    return next(new Error('Must be admin'));
  }
  if (!req.body.query_id) {
    return next(new Error('Must provide query_id'));
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
