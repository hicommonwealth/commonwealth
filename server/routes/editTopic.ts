/* eslint-disable no-restricted-syntax */
import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoTopicId: 'Must supply topic ID',
  NotAdmin: 'Must be an admin to edit or feature topics',
  NotVerified: 'Must have a verified address to edit or feature topics',
  TopicNotFound: 'Topic not found'
};

const editTopic = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.body, req.user, next);
  if (!req.body.id) {
    return next(new Error(Errors.NoTopicId));
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
    const topic = await models.OffchainTopic.findOne({ where: { id } });
    if (!topic) return next(new Error(Errors.TopicNotFound));
    if (name) topic.name = name;
    if (name || description) topic.description = description;
    await topic.save();

    if (featured_order) {
      const activeEntity = community
        ? await models.OffchainCommunity.findOne({ where: { id: community.id } })
        : await models.Chain.findOne({ where: { id: chain.id } });
      let { featured_topics } = activeEntity;
      if (featured_order === 'true' && !featured_topics.includes(`${id}`)) {
        featured_topics.push(`${id}`);
      } else if (featured_order === 'false' && featured_topics.includes(`${id}`)) {
        const idx = featured_topics.indexOf(`${id}`);
        featured_topics = featured_topics.slice(0, idx).concat(featured_topics.slice(idx + 1));
      }
      activeEntity.featured_topics = featured_topics;
      await activeEntity.save();
    }

    return res.json({ status: 'Success', result: topic.toJSON() });
  } catch (e) {
    return next(e);
  }
};

export default editTopic;
