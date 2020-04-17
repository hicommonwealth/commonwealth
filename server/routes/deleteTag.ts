/* eslint-disable no-restricted-syntax */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';

const deleteTag = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.id) {
    return next(new Error('Must supply tag ID'));
  }
  if (req.body.featured_order && !req.user.isAdmin) {
    return next(new Error('Only admins can delete tags'));
  }

  const { id } = req.body;
  const tag = await models.OffchainTag.findOne({ where: { id } });
  if (!tag) return next(new Error('Tag not found'));

  tag.destroy().then(() => {
    res.json({ status: 'Success' });
  }).catch((e) => {
    next(new Error('Could not delete tag'));
  });
};

export default deleteTag;
