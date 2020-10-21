/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes } from 'sequelize';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

// bulkThreads takes a date param and fetches the most recent 20 threads before that date
const bulkThreads = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);
  const { cutoff_date, topic_id } = req.query;
  // Threads
  let threads;
  if (cutoff_date) {
    const commentOptions = community
      ? `community = :community `
      : `chain = :chain `;

    const replacements = community
      ? { community: community.id }
      : { chain: chain.id };

    let threadOptions = '';
    if (topic_id) {
      threadOptions += `AND topic_id = :topic_id `;
      replacements['topic_id'] = topic_id;
    }

    replacements['created_at'] = cutoff_date;

    const query = `
      SELECT addr.id AS addr_id, addr.address AS addr_address,
        addr.chain AS addr_chain, thread_id, thread_title,
        thread_community, thread_chain, thread_created, 
        threads.version_history, threads.read_only, threads.body,
        threads.url, threads.pinned, topics.id AS topic_id, topics.name AS topic_name, 
        topics.description AS topic_description, topics.chain_id AS topic_chain,
        topics.community_id AS topic_community
      FROM "Addresses" AS addr
      INNER JOIN (
        SELECT t.id AS thread_id, t.title AS thread_title, t.address_id,
          t.created_at AS thread_created, t.community AS thread_community,
          t.chain AS thread_chain, t.version_history, t.read_only, t.body,
          t.url, t.pinned, t.topic_id
        FROM "OffchainThreads" t
        INNER JOIN (
          SELECT root_id, MAX(created_at) AS comm_created_at
          FROM "OffchainComments"
          WHERE ${commentOptions}
            AND root_id LIKE 'discussion%'
            AND created_at < :created_at
          GROUP BY root_id
          ) c
        ON CAST(TRIM('discussion_' FROM c.root_id) AS int) = t.id
        WHERE t.deleted_at IS NULL
          ${threadOptions}
          AND t.pinned = false
        ORDER BY c.comm_created_at DESC LIMIT 20
      ) threads
      ON threads.address_id = addr.id
      INNER JOIN "OffchainTopics" topics
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
    threads = preprocessedThreads.map((t) => {
      return ({
        id: t.thread_id,
        title: t.thread_title,
        community: t.thread_community,
        chain: t.thread_chain,
        created_at: t.thread_created,
        topic: {
          id: t.topic_id,
          name: t.topic_name,
          description: t.topic_description,
          communityId: t.topic_community,
          chainId: t.topic_chain
        },
        Address: {
          id: t.addr_id,
          address: t.addr_address,
          chain: t.addr_chain,
        }
      });
    });
    console.log(threads[0]);
  } else {
    const whereOptions = (community)
      ? { community: community.id, }
      : { chain: chain.id, };

    threads = await models.OffchainThread.findAll({
      where: whereOptions,
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ],
      order: [['created_at', 'DESC']],
    });
  }

  return res.json({ status: 'Success', result: cutoff_date ? threads : threads.map((c) => c.toJSON()) });
};

export default bulkThreads;
