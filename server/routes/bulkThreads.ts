/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { getLastEdited } from '../util/getLastEdited';

const log = factory.getLogger(formatFilename(__filename));

// bulkThreads takes a date param and fetches the most recent 20 threads before that date
const bulkThreads = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));
  const { cutoff_date, topic_id, stage } = req.query;

  const communityOptions = community
    ? `community = :community `
    : `chain = :chain `;

  const replacements = community
    ? { community: community.id }
    : { chain: chain.id };

  let topicOptions = '';
  if (topic_id) {
    topicOptions += `AND t.topic_id = :topic_id `;
    replacements['topic_id'] = topic_id;
  }
  if (stage) {
    topicOptions += `AND t.stage = :stage `;
    replacements['stage'] = stage;
  }

  replacements['created_at'] = cutoff_date;

  // Threads
  let threads;
  let comments;
  if (cutoff_date) {
    const query = `
      SELECT addr.id AS addr_id, addr.address AS addr_address,
        addr.chain AS addr_chain, thread_id, thread_title,
        thread_community, thread_chain, thread_created, threads.kind,
        threads.version_history, threads.read_only, threads.body, threads.stage,
        threads.url, threads.pinned, topics.id AS topic_id, topics.name AS topic_name,
        topics.description AS topic_description, topics.chain_id AS topic_chain,
        topics.community_id AS topic_community, collaborators
      FROM "Addresses" AS addr
      RIGHT JOIN (
        SELECT t.id AS thread_id, t.title AS thread_title, t.address_id,
          t.created_at AS thread_created, t.community AS thread_community,
          t.chain AS thread_chain, t.version_history, t.read_only, t.body,
          t.stage, t.url, t.pinned, t.topic_id, t.kind, ARRAY_AGG(
            CONCAT(
              '{ "address": "', editors.address, '", "chain": "', editors.chain, '" }'
              )
            ) AS collaborators
        FROM "OffchainThreads" t
        LEFT JOIN (
          SELECT root_id, MAX(created_at) AS comm_created_at
          FROM "OffchainComments"
          WHERE ${communityOptions}
            AND root_id LIKE 'discussion%'
            AND created_at < :created_at
            AND deleted_at IS NULL
          GROUP BY root_id
          ) c
        ON CAST(TRIM('discussion_' FROM c.root_id) AS int) = t.id
        LEFT JOIN "Collaborations" AS collaborations
        ON t.id = collaborations.offchain_thread_id
        LEFT JOIN "Addresses" editors
        ON collaborations.address_id = editors.id
        WHERE t.deleted_at IS NULL
          AND t.${communityOptions}
          ${topicOptions}
          AND t.created_at < :created_at
          AND t.pinned = false
          GROUP BY (t.id, c.comm_created_at, t.created_at)
          ORDER BY COALESCE(c.comm_created_at, t.created_at) DESC LIMIT 20
        ) threads
      ON threads.address_id = addr.id
      LEFT JOIN "OffchainTopics" topics
      ON threads.topic_id = topics.id`;

    let preprocessedThreads, threadsInVoting;
    try {
      preprocessedThreads = await models.sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });
    } catch (e) {
      console.log(e);
      return next(new Error('Could not fetch threads'));
    }

    const root_ids = [];
    threads = preprocessedThreads.map((t) => {
      const root_id = `discussion_${t.thread_id}`;
      root_ids.push(root_id);
      const collaborators = JSON.parse(t.collaborators[0]).address?.length
        ? t.collaborators.map((c) => JSON.parse(c))
        : [];
      const last_edited = getLastEdited(t);

      const data = {
        id: t.thread_id,
        title: t.thread_title,
        url: t.url,
        body: t.body,
        last_edited,
        kind: t.kind,
        stage: t.stage,
        read_only: t.read_only,
        pinned: t.pinned,
        community: t.thread_community,
        chain: t.thread_chain,
        created_at: t.thread_created,
        collaborators,
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

    comments = await models.OffchainComment.findAll({
      where: {
        root_id: root_ids
      },
      include: [models.Address, models.OffchainAttachment],
      order: [['created_at', 'DESC']],
    }).map((c) => {
      const last_edited = getLastEdited(c);
      delete c['version_history'];
      c['last_edited'] = last_edited;
      console.log(c);
      return c;
    });
  } else {
    const whereOptions = (community)
      ? { community: community.id, }
      : { chain: chain.id, };

    threads = await models.OffchainThread.findAll({
      where: whereOptions,
      include: [
        {
          model: models.Address,
          as: 'Address'
        },
        {
          model: models.Address,
          through: models.Collaboration,
          as: 'collaborators'
        },
        {
          model: models.OffchainTopic,
          as: 'topic'
        }
      ],
      order: [['created_at', 'DESC']],
    }).map((t) => {
      const last_edited = getLastEdited(t);
      delete t['version_history'];
      t['last_edited'] = last_edited;
      console.log(t);
      return t;
    });

    comments = await models.OffchainComment.findAll({
      where: whereOptions,
      include: [models.Address, models.OffchainAttachment],
      order: [['created_at', 'DESC']],
    }).map((c) => {
      const last_edited = getLastEdited(c);
      delete c['version_history'];
      c['last_edited'] = last_edited;
      console.log(c);
      return c;
    });
  }

  const reactions = await models.OffchainReaction.findAll({
    where: {
      [Op.or]: [
        { thread_id: threads.map((thread) => thread.id) },
        { comment_id: comments.map((comment) => comment.id) },
      ],
    },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  const countsQuery = `
     SELECT id, title, stage FROM "OffchainThreads"
     WHERE ${communityOptions} AND stage = 'proposal_in_review' OR stage = 'voting'`;

  const threadsInVoting = await models.sequelize.query(countsQuery, {
    replacements,
    type: QueryTypes.SELECT
  });
  const numPrevotingThreads = threadsInVoting.filter((t) => t.stage === 'proposal_in_review').length;
  const numVotingThreads = threadsInVoting.filter((t) => t.stage === 'voting').length;

  return res.json({
    status: 'Success',
    result: {
      numPrevotingThreads,
      numVotingThreads,
      threads: cutoff_date ? threads : threads.map((t) => t.toJSON()),
      comments: comments.map((c) => c.toJSON()),
      reactions: reactions.map((r) => r.toJSON()),
    }
  });
};

export default bulkThreads;
