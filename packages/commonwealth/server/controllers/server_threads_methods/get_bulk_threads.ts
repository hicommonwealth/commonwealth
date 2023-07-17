import moment from 'moment';
import { ChainInstance } from '../../models/chain';
import { Link, ThreadAttributes, ThreadInstance } from '../../models/thread';
import { ServerThreadsController } from '../server_threads_controller';
import { QueryTypes } from 'sequelize';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { getLastEdited } from '../../util/getLastEdited';

export type GetBulkThreadsOptions = {
  chain: ChainInstance;
  stage: string;
  topicId: number;
  includePinnedThreads: boolean;
  page: number;
  limit: number;
  orderBy: string;
  fromDate: string;
  toDate: string;
};

export type GetBulkThreadsResult = {
  numVotingThreads: number;
  threads: ThreadAttributes[];
  limit: number;
  page: number;
};

export async function __getBulkThreads(
  this: ServerThreadsController,
  {
    chain,
    stage,
    topicId,
    includePinnedThreads,
    page,
    limit,
    orderBy,
    fromDate,
    toDate,
  }: GetBulkThreadsOptions
): Promise<GetBulkThreadsResult> {
  // query params that bind to sql query
  const bind = (() => {
    const _limit = limit ? (limit > 500 ? 500 : limit) : 20;
    const _page = page || 1;
    const _offset = _limit * (_page - 1) || 0;
    const _to_date = toDate || moment().toISOString();

    return {
      from_date: fromDate,
      to_date: _to_date,
      page: _page,
      limit: _limit,
      offset: _offset,
      chain: chain.id,
      ...(stage && { stage }),
      ...(topicId && { topic_id: topicId }),
    };
  })();

  // sql query parts that order results by provided query param
  const orderByQueries = {
    'createdAt:asc': 'threads.thread_created ASC',
    'createdAt:desc': 'threads.thread_created DESC',
    'numberOfComments:asc': 'threads_number_of_comments ASC',
    'numberOfComments:desc': 'threads_number_of_comments DESC',
    'numberOfLikes:asc': 'threads_total_likes ASC',
    'numberOfLikes:desc': 'threads_total_likes DESC',
  };

  // get response threads from query
  let responseThreads;
  try {
    responseThreads = await this.models.sequelize.query(
      `
      SELECT addr.id AS addr_id, addr.address AS addr_address, last_commented_on,
        addr.chain AS addr_chain, threads.thread_id, thread_title,
        threads.marked_as_spam_at,
        threads.archived_at,
        thread_chain, thread_created, thread_updated, thread_locked, threads.kind,
        threads.read_only, threads.body, threads.stage,
        threads.has_poll, threads.plaintext,
        threads.url, threads.pinned, COALESCE(threads.number_of_comments,0) as threads_number_of_comments,
        threads.reaction_ids, threads.reaction_type, threads.addresses_reacted, COALESCE(threads.total_likes, 0) as threads_total_likes,
        threads.links as links,
        topics.id AS topic_id, topics.name AS topic_name, topics.description AS topic_description,
        topics.chain_id AS topic_chain,
        topics.telegram AS topic_telegram,
        collaborators
      FROM "Addresses" AS addr
      RIGHT JOIN (
        SELECT t.id AS thread_id, t.title AS thread_title, t.address_id, t.last_commented_on,
          t.created_at AS thread_created,
          t.marked_as_spam_at,
          t.archived_at,
          t.updated_at AS thread_updated,
          t.locked_at AS thread_locked,
          t.chain AS thread_chain, t.read_only, t.body, comments.number_of_comments,
          reactions.reaction_ids, reactions.reaction_type, reactions.addresses_reacted, reactions.total_likes,
          t.has_poll,
          t.plaintext,
          t.stage, t.url, t.pinned, t.topic_id, t.kind, t.links, ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "address": "', editors.address, '", "chain": "', editors.chain, '" }'
              )
            ) AS collaborators
        FROM "Threads" t
        LEFT JOIN "Collaborations" AS collaborations
        ON t.id = collaborations.thread_id
        LEFT JOIN "Addresses" editors
        ON collaborations.address_id = editors.id
        LEFT JOIN (
            SELECT thread_id, COUNT(*)::int AS number_of_comments
            FROM "Comments"
            WHERE deleted_at IS NULL
            GROUP BY thread_id
        ) comments
        ON t.id = comments.thread_id
        LEFT JOIN (
            SELECT thread_id,
            COUNT(r.id)::int AS total_likes,
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
          ${topicId ? ` AND t.topic_id = $topic_id ` : ''}
          ${stage ? ` AND t.stage = $stage ` : ''}
          AND (${includePinnedThreads ? 't.pinned = true OR' : ''}
          (COALESCE(t.last_commented_on, t.created_at) < $to_date AND t.pinned = false))
          GROUP BY (t.id, COALESCE(t.last_commented_on, t.created_at), comments.number_of_comments,
          reactions.reaction_ids, reactions.reaction_type, reactions.addresses_reacted, reactions.total_likes)
          ORDER BY t.pinned DESC, COALESCE(t.last_commented_on, t.created_at) DESC
        ) threads
      ON threads.address_id = addr.id
      LEFT JOIN "Topics" topics
      ON threads.topic_id = topics.id
      ${fromDate ? ' WHERE threads.thread_created > $from_date ' : ''}
      ${
        toDate
          ? (fromDate ? ' AND ' : ' WHERE ') +
            ' threads.thread_created < $to_date '
          : ''
      }
      ${includePinnedThreads || orderByQueries[orderBy] ? 'ORDER BY ' : ''}
      ${includePinnedThreads ? ' threads.pinned DESC' : ''}
      ${
        orderByQueries[orderBy]
          ? (includePinnedThreads ? ',' : '') + orderByQueries[orderBy]
          : ''
      }
      LIMIT $limit OFFSET $offset
    `,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    );
  } catch (e) {
    console.error(e);
    throw new ServerError('Could not fetch threads');
  }

  const processLinks = async (thread) => {
    let chain_entity_meta = [];
    if (thread.links) {
      const ces = thread.links.filter((item) => item.source === 'proposal');
      if (ces.length > 0) {
        chain_entity_meta = ces.map((ce: Link) => {
          return { ce_id: parseInt(ce.identifier), title: ce.title };
        });
      }
    }
    return { chain_entity_meta };
  };

  // transform thread response
  let threads = responseThreads.map(async (t) => {
    const collaborators = JSON.parse(t.collaborators[0]).address?.length
      ? t.collaborators.map((c) => JSON.parse(c))
      : [];
    const { chain_entity_meta } = await processLinks(t);

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
      updated_at: t.thread_updated,
      locked_at: t.thread_locked,
      links: t.links,
      collaborators,
      chain_entity_meta,
      has_poll: t.has_poll,
      last_commented_on: t.last_commented_on,
      plaintext: t.plaintext,
      Address: {
        id: t.addr_id,
        address: t.addr_address,
        chain: t.addr_chain,
      },
      numberOfComments: t.threads_number_of_comments,
      reactionIds: t.reaction_ids ? t.reaction_ids.split(',') : [],
      addressesReacted: t.addresses_reacted
        ? t.addresses_reacted.split(',')
        : [],
      reactionType: t.reaction_type ? t.reaction_type.split(',') : [],
      marked_as_spam_at: t.marked_as_spam_at,
      archived_at: t.archived_at,
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

  const countsQuery = `
     SELECT id, title, stage FROM "Threads"
     WHERE chain = $chain AND (stage = 'proposal_in_review' OR stage = 'voting')`;

  const threadsInVoting: ThreadInstance[] = await this.models.sequelize.query(
    countsQuery,
    {
      bind,
      type: QueryTypes.SELECT,
    }
  );
  const numVotingThreads = threadsInVoting.filter(
    (t) => t.stage === 'voting'
  ).length;

  threads = await Promise.all(threads);

  return {
    limit: bind.limit,
    page: bind.page,
    // data params
    threads,
    numVotingThreads,
  };
}
