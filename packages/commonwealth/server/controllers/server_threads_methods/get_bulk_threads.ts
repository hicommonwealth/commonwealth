import { ServerError } from '@hicommonwealth/core';
import { ThreadAttributes } from '@hicommonwealth/model';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { ServerThreadsController } from '../server_threads_controller';

export type GetBulkThreadsOptions = {
  communityId: string;
  stage: string;
  topicId: number;
  includePinnedThreads: boolean;
  page: number;
  limit: number;
  orderBy: string;
  fromDate: string;
  toDate: string;
  archived: boolean;
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
    communityId,
    stage,
    topicId,
    includePinnedThreads,
    page,
    limit,
    orderBy,
    fromDate,
    toDate,
    archived,
  }: GetBulkThreadsOptions,
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
      ...(communityId && { community_id: communityId }),
      ...(stage && { stage }),
      ...(topicId && { topic_id: topicId }),
    };
  })();

  // sql query parts that order results by provided query param
  const orderByQueries = {
    newest: 'created_at DESC',
    oldest: 'created_at ASC',
    mostLikes: 'reaction_count DESC',
    mostComments: 'comment_count DESC',
    latestActivity: 'updated_at DESC',
  };

  // get response threads from query
  const responseThreadsQuery = this.models.sequelize.query(
    `
WITH top_threads AS (
    SELECT id
    FROM "Threads"
        WHERE deleted_at IS NULL AND community_id = $community_id
        ${topicId ? ` AND topic_id = $topic_id ` : ''}
        ${stage ? ` AND stage = $stage ` : ''}
         AND archived_at IS ${archived ? 'NOT' : ''} NULL 
         ${
           toDate
             ? (fromDate ? ' AND ' : ' WHERE ') + ' created_at < $to_date '
             : ''
         }
    ORDER BY pinned DESC, ${orderByQueries[orderBy] ?? 'created_at DESC'} 
    LIMIT $limit OFFSET $offset
)
SELECT 
    jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'body', t.body,
        'url', t.url,
        'last_edited', t.last_edited,
        'kind', t.kind,
        'stage', t.stage,
        'read_only', t.read_only,
        'discord_meta', t.discord_meta,
        'pinned', t.pinned,
        'chain', t.community_id,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'locked_at', t.locked_at,
        'links', t.links,
        'has_poll', t.has_poll,
        'last_commented_on', t.last_commented_on,
        'plaintext', t.plaintext,
        'marked_as_spam_at', t.marked_as_spam_at,
        'archived_at', t.archived_at,
        'latest_activity', t.max_notif_id
    ) AS thread_info,
    jsonb_strip_nulls(jsonb_build_object(
        'address', ad.address::text,
        'name', pr.profile_name::text,
        'avatar_url', pr.avatar_url::text,
        'last_active', ad.last_active::text,
        'profile_id', pr.id::text
    )) AS address_info,
    jsonb_agg(json_strip_nulls(json_build_object(
        'id', editors.id,
        'address', editors.address,
        'chain', editors.community_id,
        'avatar_url', editor_profiles.avatar_url::text,
        'last_active', editors.last_active::text,
        'profile_id', editor_profiles.id::text
    ))) AS collaborators,
    jsonb_build_object(
        'topic_id', topics.id,
        'topic_name', topics.name,
        'topic_description', topics.description,
        'topic_community_id', topics.community_id,
        'topic_telegram', topics.telegram
    ) AS topic_info,
    (
       SELECT json_agg(json_strip_nulls(json_build_object(
        'address', ad.address::text,
        'reaction_type', r.reaction::text,
        'reaction_id', r.id::text,
        'reaction_timestamp', r.created_at::text,
        'reaction_weight', r.calculated_voting_weight::text,
        'name', pr.profile_name::text,
        'avatar_url', pr.avatar_url::text,
        'last_active', ad.last_active::text,
        'profile_id', pr.id::text
    ))) FROM "Reactions" AS r
        LEFT JOIN "Addresses" AS ad ON r.address_id = ad.id
        LEFT JOIN "Profiles" AS pr ON pr.user_id = ad.user_id
        WHERE r.thread_id = t.id
) AS reaction_info
FROM top_threads
LEFT JOIN "Threads" AS t ON top_threads.id = t.id
LEFT JOIN "Addresses" AS ad ON ad.id = t.address_id
LEFT JOIN "Profiles" AS pr ON pr.user_id = ad.user_id
LEFT JOIN "Collaborations" AS collaborations ON t.id = collaborations.thread_id
LEFT JOIN "Addresses" AS editors ON collaborations.address_id = editors.id
LEFT JOIN "Profiles" AS editor_profiles ON editors.user_id = editor_profiles.user_id
LEFT JOIN "Topics" AS topics ON t.topic_id = topics.id
GROUP BY t.id, ad.address, ad.last_active, pr.id, topics.id
LIMIT $limit;          
    `,
    {
      bind,
      type: QueryTypes.SELECT,
      logging: true,
    },
  );

  const numVotingThreadsQuery = this.models.Thread.count({
    where: {
      community_id: communityId,
      stage: 'voting',
    },
  });

  try {
    const [threads, numVotingThreads] = await Promise.all([
      responseThreadsQuery,
      numVotingThreadsQuery,
    ]);

    return {
      limit: bind.limit,
      page: bind.page,
      // data params
      threads,
      numVotingThreads,
    };
  } catch (e) {
    console.error(e);
    throw new ServerError('Could not fetch threads');
  }
}
