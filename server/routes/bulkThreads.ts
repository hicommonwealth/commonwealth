/* eslint-disable quotes */
import { Request, Response, NextFunction } from 'express';
import { QueryTypes, Op } from 'sequelize';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { getLastEdited } from '../util/getLastEdited';
import { DB } from '../database';
import { OffchainThreadInstance } from '../models/offchain_thread';

const log = factory.getLogger(formatFilename(__filename));
// bulkThreads takes a date param and fetches the most recent 20 threads before that date
const bulkThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));
  const { cutoff_date, topic_id, stage } = req.query;
  console.log(cutoff_date);
  console.log(topic_id);
  console.log(stage);

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
        addr.chain AS addr_chain, thread_id, thread_title,
        thread_chain, thread_created, threads.kind,
        threads.read_only, threads.body, threads.stage, threads.snapshot_proposal,
        threads.offchain_voting_enabled, threads.offchain_voting_options, 
        threads.offchain_voting_votes, threads.offchain_voting_ends_at,
        threads.url, threads.pinned, topics.id AS topic_id, topics.name AS topic_name,
        topics.description AS topic_description, topics.chain_id AS topic_chain,
        topics.telegram AS topic_telegram,
        collaborators, chain_entities, linked_threads
      FROM "Addresses" AS addr
      RIGHT JOIN (
        SELECT t.id AS thread_id, t.title AS thread_title, t.address_id, t.last_commented_on,
          t.created_at AS thread_created,
          t.chain AS thread_chain, t.read_only, t.body,
          t.offchain_voting_enabled, t.offchain_voting_options, t.offchain_voting_votes, t.offchain_voting_ends_at,
          t.stage, t.snapshot_proposal, t.url, t.pinned, t.topic_id, t.kind, ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "address": "', editors.address, '", "chain": "', editors.chain, '" }'
              )
            ) AS collaborators,
          ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "id": "', chain_entities.id, '",
                  "type": "', chain_entities.type, '",
                 "type_id": "', chain_entities.type_id, '",
                 "completed": "', chain_entities.completed, '" }'
              )
            ) AS chain_entities,
          ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "id": "', linked_threads.id, '",
                  "linked_thread": "', linked_threads.linked_thread, '",
                  "linking_thread": "', linked_threads.linking_thread, '" }'
            )
          ) AS linked_threads 
        FROM "OffchainThreads" t
        LEFT JOIN "LinkedThreads" AS linked_threads
        ON t.id = linked_threads.linking_thread
        LEFT JOIN "Collaborations" AS collaborations
        ON t.id = collaborations.offchain_thread_id
        LEFT JOIN "Addresses" editors
        ON collaborations.address_id = editors.id
        LEFT JOIN "ChainEntities" AS chain_entities
        ON t.id = chain_entities.thread_id
        WHERE t.deleted_at IS NULL
          AND t.chain = $chain 
          ${topicOptions}
          AND COALESCE(t.last_commented_on, t.created_at) < $created_at
          AND t.pinned = false
          GROUP BY (t.id, COALESCE(t.last_commented_on, t.created_at))
          ORDER BY COALESCE(t.last_commented_on, t.created_at) DESC LIMIT 20
        ) threads
      ON threads.address_id = addr.id
      LEFT JOIN "OffchainTopics" topics
      ON threads.topic_id = topics.id`;
    let preprocessedThreads;
    try {
      preprocessedThreads = await models.sequelize.query(query, {
        bind,
        type: QueryTypes.SELECT,
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
      const chain_entities = JSON.parse(t.chain_entities[0]).id
        ? t.chain_entities.map((c) => JSON.parse(c))
        : [];
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
        chain_entities,
        snapshot_proposal: t.snapshot_proposal,
        offchain_voting_enabled: t.offchain_voting_enabled,
        offchain_voting_options: t.offchain_voting_options,
        offchain_voting_votes: t.offchain_voting_votes,
        offchain_voting_ends_at: t.offchain_voting_ends_at,
        last_commented_on: t.last_commented_on,
        Address: {
          id: t.addr_id,
          address: t.addr_address,
          chain: t.addr_chain,
        },
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
        await models.OffchainThread.findAll({
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
              model: models.OffchainTopic,
              as: 'topic',
            },
            {
              model: models.ChainEntity,
            },
            {
              model: models.LinkedThread,
              as: 'linked_threads',
            },
          ],
          attributes: { exclude: ['version_history'] },
          order: [['created_at', 'DESC']],
        })
      ).map((t, idx) => {
        const row = t.toJSON();
        const last_edited = getLastEdited(row);
        row['last_edited'] = last_edited;
        return row;
      });
  }

  const countsQuery = `
     SELECT id, title, stage FROM "OffchainThreads"
     WHERE chain = $chain AND (stage = 'proposal_in_review' OR stage = 'voting')`;

  const threadsInVoting: OffchainThreadInstance[] =
    await models.sequelize.query(countsQuery, {
      bind,
      type: QueryTypes.SELECT,
    });
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
