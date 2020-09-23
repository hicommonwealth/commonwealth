import { Response, NextFunction, Request } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NeedChainOrCommunity: 'Must provide a chain or community',
};

// Topics, comments, reactions, members+admins, threads
const bulkOffchain = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);
  if (!chain && !community) return next(new Error(Errors.NeedChainOrCommunity));

  const userAddresses = await req.user.getAddresses();
  const userAddressIds = Array.from(userAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id));
  const rolesQuery = (community)
    ? { address_id: { [Op.in]: userAddressIds }, offchain_community_id: community.id, }
    : { address_id: { [Op.in]: userAddressIds }, chain_id: chain.id };
  const roles = await models.Role.findAll({
    where: rolesQuery
  });

  const adminRoles = roles.filter((r) => r.permission === 'admin' || r.permission === 'moderator');

  // Threads
  let filteredThreads;
  if (!req.user) { // if not logged in, return public threads
    const publicThreadsQuery = (community)
      ? { community: community.id, private: false, }
      : { chain: chain.id, private: false, };

    filteredThreads = await models.OffchainThread.findAll({
      where: publicThreadsQuery,
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
      order: [['created_at', 'DESC']],
    });
  } else { // if logged in, return public threads and owned private threads
    const allThreadsQuery = (community)
      ? { community: community.id, }
      : { chain: chain.id, };

    const allThreads = await models.OffchainThread.findAll({
      where: allThreadsQuery,
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
      order: [['created_at', 'DESC']],
    });

    filteredThreads = await allThreads.filter((thread) => {
      if (thread.private === false) {
        return true;
      } else if (userAddressIds.includes(thread.address_id)) {
        return true;
      } else if (adminRoles.length > 0) {
        return true;
      } else {
        return false;
      }
    });
  }

  // Topics
  const topics = await models.OffchainTopic.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id },
  });

  // Comments
  const whereOptions: any = {};
  if (community) {
    whereOptions.community = community.id;
  } else {
    whereOptions.chain = chain.id;
    whereOptions.root_id = { [Op.like]: 'discussion%' };
  }
  const comments = await models.OffchainComment.findAll({
    where: whereOptions,
    include: [ models.Address, models.OffchainAttachment ],
    order: [['created_at', 'DESC']],
  });

  // Reactions
  const reactions = await models.OffchainReaction.findAll({
    where: community
      ? { community: community.id }
      : { chain: chain.id },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  // Members
  const admins = await models.Role.findAll({
    where: chain ? {
      chain_id: chain.id,
      permission: { [Op.in]: ['admin', 'moderator'] },
    } : {
      offchain_community_id: community.id,
      permission: { [Op.in]: ['admin', 'moderator'] },
    },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  return res.json({
    status: 'Success',
    result: {
      topics: topics.map((c) => c.toJSON()),
      comments: comments.map((c) => c.toJSON()),
      reactions: reactions.map((c) => c.toJSON()),
      admins: admins.map((p) => p.toJSON()),
      threads: filteredThreads.map((c) => c.toJSON()),
    }
  });
};

export default bulkOffchain;
