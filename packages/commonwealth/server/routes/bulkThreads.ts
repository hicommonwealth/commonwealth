/* eslint-disable quotes */
import { ServerError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import type { DB } from '../models';
import type { ThreadInstance } from '../models/thread';
import { getLastEdited } from '../util/getLastEdited';
// bulkThreads takes a date param and fetches the most recent 20 threads before that date
const bulkThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chain = req.chain;
  const { cutoff_date, topic_id, includePinnedThreads, stage } = req.query;

  const bind = { chain: chain.id };

  let topicOptions = '';
  if (topic_id) {
    topicOptions += `AND t.topic_id = $topic_id `;
    bind['topic_id'] = topic_id;
  }
  if (stage) {
    topicOptions += `AND t.stage = $stage `;
    bind['stage'] = stage;
  }

  bind['created_at'] = cutoff_date;

  let threads;
  if (cutoff_date) {
    const query = `
      SELECT addr.id AS addr_id, addr.address AS addr_address, last_commented_on,
        addr.chain AS addr_chain, threads.thread_id, thread_title,
        thread_chain, thread_created, threads.kind,
        threads.read_only, threads.body, threads.stage, threads.snapshot_proposal,
        threads.has_poll, threads.plaintext,
        threads.url, threads.pinned, threads.number_of_comments,
        threads.reaction_ids, threads.reaction_type, threads.addresses_reacted,
        topics.id AS topic_id, topics.name AS topic_name, topics.description AS topic_description,
        topics.chain_id AS topic_chain,
        topics.telegram AS topic_telegram,
        collaborators, chain_entity_meta, linked_threads
      FROM "Addresses" AS addr
      RIGHT JOIN (
        SELECT t.id AS thread_id, t.title AS thread_title, t.address_id, t.last_commented_on,
          t.created_at AS thread_created,
          t.chain AS thread_chain, t.read_only, t.body, comments.number_of_comments,
          reactions.reaction_ids, reactions.reaction_type, reactions.addresses_reacted,
          t.has_poll,
          t.plaintext,
          t.stage, t.snapshot_proposal, t.url, t.pinned, t.topic_id, t.kind, ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "address": "', editors.address, '", "chain": "', editors.chain, '" }'
              )
            ) AS collaborators,
          ARRAY_AGG(
              JSON_BUILD_OBJECT('ce_id', entity_meta.ce_id, 'title', entity_meta.title)
            ) AS chain_entity_meta,
          ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "id": "', linked_threads.id, '",
                  "linked_thread": "', linked_threads.linked_thread, '",
                  "linking_thread": "', linked_threads.linking_thread, '" }'
            )
          ) AS linked_threads 
        FROM "Threads" t
        LEFT JOIN "LinkedThreads" AS linked_threads
        ON t.id = linked_threads.linking_thread
        LEFT JOIN "Collaborations" AS collaborations
        ON t.id = collaborations.thread_id
        LEFT JOIN "Addresses" editors
        ON collaborations.address_id = editors.id
        LEFT JOIN "ChainEntityMeta" AS entity_meta
        ON t.id = entity_meta.thread_id
        LEFT JOIN (
            SELECT root_id, COUNT(*) AS number_of_comments
            FROM "Comments"
            WHERE deleted_at IS NULL
            GROUP BY root_id
        ) comments
        ON CONCAT(t.kind, '_', t.id) = comments.root_id
        LEFT JOIN (
            SELECT thread_id,
            STRING_AGG(ad.address::text, ',') AS addresses_reacted,
            STRING_AGG(r.reaction::text, ',') AS reaction_type,
            STRING_AGG(r.id::text, ',') AS reaction_ids
            FROM "Reactions" as r
            LEFT JOIN "Addresses" ad
            ON r.address_id = ad.id
            GROUP BY thread_id
        ) reactions
        ON t.id = reactions.thread_id
        WHERE t.deleted_at IS NULL
          AND t.chain = $chain
          ${topicOptions}
          AND (${includePinnedThreads ? 't.pinned = true OR' : ''}
          (COALESCE(t.last_commented_on, t.created_at) < $created_at AND t.pinned = false))
          GROUP BY (t.id, COALESCE(t.last_commented_on, t.created_at), comments.number_of_comments,
           reactions.reaction_ids, reactions.reaction_type, reactions.addresses_reacted)
          ORDER BY t.pinned DESC, COALESCE(t.last_commented_on, t.created_at) DESC LIMIT 20
        ) threads
      ON threads.address_id = addr.id
      LEFT JOIN "Topics" topics
      ON threads.topic_id = topics.id
      ${includePinnedThreads ? 'ORDER BY threads.pinned DESC' : ''}`;
    let preprocessedThreads;
    try {
      preprocessedThreads = await models.sequelize.query(query, {
        bind,
        type: QueryTypes.SELECT,
      });
    } catch (e) {
      console.log(e);
      return next(new ServerError('Could not fetch threads'));
    }

    const root_ids = [];
    threads = preprocessedThreads.map((t) => {
      const root_id = `discussion_${t.thread_id}`;
      root_ids.push(root_id);
      const collaborators = JSON.parse(t.collaborators[0]).address?.length
        ? t.collaborators.map((c) => JSON.parse(c))
        : [];
      let chain_entity_meta = [];
      if (t.chain_entity_meta[0].ce_id) chain_entity_meta = t.chain_entity_meta;
      const linked_threads = JSON.parse(t.linked_threads[0]).id
        ? t.linked_threads.map((c) => JSON.parse(c))
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
        chain: t.thread_chain,
        created_at: t.thread_created,
        collaborators,
        linked_threads,
        chain_entity_meta,
        snapshot_proposal: t.snapshot_proposal,
        has_poll: t.has_poll,
        last_commented_on: t.last_commented_on,
        plaintext: t.plaintext,
        Address: {
          id: t.addr_id,
          address: t.addr_address,
          chain: t.addr_chain,
        },
        numberOfComments: t.number_of_comments,
        reactionIds: t.reaction_ids ? t.reaction_ids.split(',') : [],
        addressesReacted: t.addresses_reacted
          ? t.addresses_reacted.split(',')
          : [],
        reactionType: t.reaction_type ? t.reaction_type.split(',') : [],
      };
      if (t.topic_id) {
        data['topic'] = {
          id: t.topic_id,
          name: t.topic_name,
          description: t.topic_description,
          chainId: t.topic_chain,
          telegram: t.telegram,
        };
      }
      return data;
    });
  } else {
    threads =
      // TODO: May need to include last_commented_on in order, if this else is used
      (
        await models.Thread.findAll({
          where: { chain: chain.id },
          include: [
            {
              model: models.Address,
              as: 'Address',
            },
            {
              model: models.Address,
              as: 'collaborators',
            },
            {
              model: models.Topic,
              as: 'topic',
            },
            {
              model: models.ChainEntityMeta,
              as: 'chain_entity_meta',
            },
            {
              model: models.LinkedThread,
              as: 'linked_threads',
            },
          ],
          attributes: { exclude: ['version_history'] },
          order: [['created_at', 'DESC']],
        })
      ).map((t) => {
        const row = t.toJSON();
        const last_edited = getLastEdited(row);
        row['last_edited'] = last_edited;
        return row;
      });
  }

  const countsQuery = `
     SELECT id, title, stage FROM "Threads"
     WHERE chain = $chain AND (stage = 'proposal_in_review' OR stage = 'voting')`;

  const threadsInVoting: ThreadInstance[] = await models.sequelize.query(
    countsQuery,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );
  const numVotingThreads = threadsInVoting.filter(
    (t) => t.stage === 'voting'
  ).length;

  return res.json({
    status: 'Success',
    result: {
      numVotingThreads,
      threads,
    },
  });
};

export default bulkThreads;
