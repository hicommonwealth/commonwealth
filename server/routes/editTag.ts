/* eslint-disable no-restricted-syntax */
import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';

const editTag = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.id) {
    return next(new Error('Must supply tag ID'));
  }
  if (req.body.featured_order) {
    const adminAddress = await models.Address.findOne({
      where: {
        address: req.body.address,
        user_id: req.user.id,
      },
    });
    const roleWhere = {
      address_id: adminAddress.id,
      permission: 'admin',
    };
    if (community) roleWhere['offchain_community_id'] = community.id;
    else if (chain) roleWhere['chain_id'] = chain.id;
    const requesterIsAdminOrMod = await models.Role.findAll({
      where: roleWhere,
    });
    if (!requesterIsAdminOrMod) return next(new Error('Must be an admin to feature tags.'));
  }

  const { description, featured_order, id, name } = req.body;
  try {
    const tag = await models.OffchainTag.findOne({ where: { id } });
    if (!tag) return next(new Error('Tag not found'));
    if (description) tag.description = description;
    if (name) tag.name = name;
    await tag.save();

    if (featured_order) {
      const activeEntity = community
        ? await models.OffchainCommunity.findOne({ where: { id: community.id } })
        : await models.Chain.findOne({ where: { id: chain.id } });
      let { featured_tags } = activeEntity;
      if (featured_order === 'true') {
        if (!featured_tags.includes(`${id}`)) {
          featured_tags.push(`${id}`);
        }
      } else if (featured_order === 'false') {
        if (featured_tags.includes(`${id}`)) {
          const idx = featured_tags.indexOf(`${id}`);
          featured_tags = featured_tags.slice(0, idx).concat(featured_tags.slice(idx + 1));
        }
      }
      activeEntity.featured_tags = featured_tags;
      await activeEntity.save();
    }

    return res.json({ status: 'Success', result: tag.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editTag;
