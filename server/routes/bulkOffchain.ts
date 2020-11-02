/* eslint-disable quotes */
import { QueryTypes } from 'sequelize';
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

  // Topics
  const topics = await models.OffchainTopic.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id }
  });

  // Threads
  const communityOptions = community
    ? `community = :community`
    : `chain = :chain`;

  const replacements = community
    ? { community: community.id }
    : { chain: chain.id };

  const threadParams = Object.assign(replacements, { pinned: true });
  const pinnedThreads = await models.OffchainThread.findAll({
    where: threadParams,
    include: [models.Address, { model: models.OffchainTopic, as: 'topic' }]
  });

  const query = `
    SELECT addr.id AS addr_id, addr.address AS addr_address,
      addr.chain AS addr_chain, thread_id, thread_title,
      thread_community, thread_chain, thread_created, threads.kind,
      threads.version_history, threads.read_only, threads.body,
      threads.url, threads.pinned, topics.id AS topic_id, topics.name AS topic_name, 
      topics.description AS topic_description, topics.chain_id AS topic_chain,
      topics.community_id AS topic_community
    FROM "Addresses" AS addr
    RIGHT JOIN (
      SELECT t.id AS thread_id, t.title AS thread_title, t.address_id,
        t.created_at AS thread_created, t.community AS thread_community,
        t.chain AS thread_chain, t.version_history, t.read_only, t.body,
        t.url, t.pinned, t.topic_id, t.kind
      FROM "OffchainThreads" t
      LEFT JOIN (
        SELECT root_id, MAX(created_at) AS comm_created_at
        FROM "OffchainComments"
        WHERE ${communityOptions}
        AND root_id LIKE 'discussion%'
        GROUP BY root_id
        ) c
      ON CAST(TRIM('discussion_' FROM c.root_id) AS int) = t.id
      WHERE t.${communityOptions} 
      AND t.deleted_at IS NULL
      AND t.pinned = false
      ORDER BY COALESCE(c.comm_created_at, t.created_at) DESC LIMIT ${20 - pinnedThreads.length}
    ) threads
    ON threads.address_id = addr.id
    LEFT JOIN "OffchainTopics" topics
    ON threads.topic_id = topics.id`;

  let preprocessedThreads;
  try {
    preprocessedThreads = await models.sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT
    });
  } catch (e) {
    console.log(e);
  }

  const root_ids = [];
  const threads = preprocessedThreads.map((t) => {
    const root_id = `discussion_${t.thread_id}`;
    root_ids.push(root_id);
    const data = {
      id: t.thread_id,
      title: t.thread_title,
      url: t.url,
      body: t.body,
      version_history: t.version_history,
      kind: t.kind,
      read_only: t.read_only,
      pinned: t.pinned,
      community: t.thread_community,
      chain: t.thread_chain,
      created_at: t.thread_created,
      Address: {
        id: t.addr_id,
        address: t.addr_address,
        chain: t.addr_chain,
      }
    };
    if (t.topic_id) {
      data['topic'] = {
        id: t.topic_id,
        name: t.topic_name,
        description: t.topic_description,
        communityId: t.topic_community,
        chainId: t.topic_chain
      };
    }
    return data;
  });

  const allThreads = pinnedThreads.map((t) => t.toJSON()).concat(threads);

  // Comments
  const comments = await models.OffchainComment.findAll({
    where: {
      root_id: root_ids
    },
    include: [models.Address, models.OffchainAttachment],
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
      topics: topics.map((t) => t.toJSON()),
      reactions: reactions.map((r) => r.toJSON()),
      admins: admins.map((a) => a.toJSON()),
      comments: comments.map((c) => c.toJSON()),
      threads: allThreads,
    }
  });
};

export default bulkOffchain;
