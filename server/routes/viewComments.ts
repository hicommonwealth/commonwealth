import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NoRootId: 'Must provide root_id',
};

const viewComments = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  if (!req.query.root_id) {
    return next(new Error(Errors.NoRootId));
  }

  const comments = await models.OffchainComment.findAll({
    where: community
      ? { community: community.id, root_id: req.query.root_id }
      : { chain: chain.id, root_id: req.query.root_id },
    include: [
      models.Address,
      models.OffchainAttachment,
      {
        model: models.OffchainReaction,
        as: 'reactions',
        include: [{
          model: models.Address,
          as: 'Address'
        }]
      }
    ],
    order: [['created_at', 'DESC']],
    paranoid: false,
  });
  return res.json({ status: 'Success', result: comments.map((c) => c.toJSON()) });
};

export default viewComments;
