/* eslint-disable no-restricted-syntax */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTagId: 'Must provide tag ID',
  NotAdmin: 'Only admins can delete tags',
  TagNotFound: 'Tag not found',
  DeleteFail: 'Could not delete tag',
};

const deleteTag = async (models, req, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.id) {
    return next(new Error(Errors.NoTagId));
  }
  if (req.body.featured_order && !req.user.isAdmin) {
    return next(new Error(Errors.NotAdmin));
  }

  const { id } = req.body;
  const tag = await models.OffchainTag.findOne({ where: { id } });
  if (!tag) return next(new Error(Errors.TagNotFound));

  tag.destroy().then(() => {
    res.json({ status: 'Success' });
  }).catch((e) => {
    next(new Error(Errors.DeleteFail));
  });
};

export default deleteTag;
