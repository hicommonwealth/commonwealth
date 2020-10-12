import Sequelize from 'sequelize';
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

  let userAddressIds = [];
  let adminRoles = [];
  if (req.user) {
    const userAddresses = await req.user.getAddresses();
    userAddressIds = Array.from(userAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id));
    const rolesQuery = (community)
      ? { address_id: { [Op.in]: userAddressIds }, offchain_community_id: community.id, }
      : { address_id: { [Op.in]: userAddressIds }, chain_id: chain.id };
    const roles = await models.Role.findAll({
      where: rolesQuery
    });
    adminRoles = roles.filter((r) => r.permission === 'admin' || r.permission === 'moderator');
  }

  // Threads
  const publicThreadsQuery = (community)
    ? { community: community.id }
    : { chain: chain.id };

  const filteredThreads = await models.OffchainThread.findAll({
    where: publicThreadsQuery,
    include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
    order: [['created_at', 'DESC']],
  });

  // Topics
  const topics = await models.OffchainTopic.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id },
  });

  // Threads
  const whereOptions = community
    ? `WHERE community='${community.id}'`
    : `WHERE chain=${chain.id} AND root_id LIKE 'discussion%'`;

  const query = `SELECT *
    FROM "OffchainThreads"
    WHERE id in (
      SELECT CAST(TRIM('discussion_' FROM root_id) AS int)
      FROM (
        SELECT root_id, created_at, id
        FROM (
          SELECT root_id, MAX(created_at) as created_at, MAX(id) as id 
          FROM "OffchainComments" 
          ${whereOptions}
          GROUP BY root_id) grouped_comments
        ORDER BY created_at DESC LIMIT 20) ordered_comments
      )
  ;`;

  const threads = await models.sequelize.query(query);
  console.log(threads);

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
      reactions: reactions.map((c) => c.toJSON()),
      admins: admins.map((p) => p.toJSON()),
      threads: threads.map((c) => c.toJSON()),
    }
  });
};

export default bulkOffchain;
