/* eslint-disable no-restricted-syntax */
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in.',
  NoTagId: 'Must supply tag ID.',
  NotAdmin: 'Must be an admin to edit or feature tags.',
  NotVerified: 'Must have a verified address to edit or feature tags',
  TagNotFound: 'Tag not found.'
};

const editTag = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.body.id) {
    return next(new Error(Errors.NoTagId));
  }

  const adminAddress = await models.Address.findOne({
    where: {
      address: req.body.address,
      user_id: req.user.id,
    },
  });
  if (!adminAddress.verified) {
    return next(new Error(Errors.NotVerified));
  }

  const roleWhere = {
    address_id: adminAddress.id,
    permission: 'admin',
  };
  if (community) {
    roleWhere['offchain_community_id'] = community.id;
  } else if (chain) {
    roleWhere['chain_id'] = chain.id;
  }
  const requesterIsAdminOrMod = await models.Role.findOne({
    where: roleWhere,
  });
  if (requesterIsAdminOrMod === null) {
    return next(new Error(Errors.NotAdmin));
  }

  const { description, featured_order, id, name } = req.body;
  try {
    const tag = await models.OffchainTag.findOne({ where: { id } });
    if (!tag) return next(new Error(Errors.TagNotFound));
    if (description) tag.description = description;
    if (name) tag.name = name;
    await tag.save();

    if (featured_order) {
      const activeEntity = community
        ? await models.OffchainCommunity.findOne({ where: { id: community.id } })
        : await models.Chain.findOne({ where: { id: chain.id } });
      let { featured_tags } = activeEntity;
      if (featured_order === 'true' && !featured_tags.includes(`${id}`)) {
        featured_tags.push(`${id}`);
      } else if (featured_order === 'false' && featured_tags.includes(`${id}`)) {
        const idx = featured_tags.indexOf(`${id}`);
        featured_tags = featured_tags.slice(0, idx).concat(featured_tags.slice(idx + 1));
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
