import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const createTag = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  console.dir(req.body);
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!chain && !community) return next(new Error('Invalid chain or community'));
  if (chain && community) return next(new Error('Invalid chain or community'));
  if (!req.user) return next(new Error('Not logged in'));
  if (!req.body.name) return next(new Error('Tag name required'));

  const options = community ? {
    name: req.body.name,
    community_id: community.id,
  } : {
    name: req.body.name,
    chain_id: chain.id,
  };

  const newTag = await models.OffchainTag.findOrCreate({
    where: options,
    default: options,
  });

  return res.json({ status: 'Success', result: newTag[0] });
};

export default createTag;
