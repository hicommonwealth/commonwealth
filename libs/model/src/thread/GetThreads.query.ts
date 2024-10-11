import { InvalidInput, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetThreads(): Query<typeof schemas.GetThreads> {
  return {
    ...schemas.GetThreads,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        community_id,
        stage,
        topic_id,
        page,
        limit,
        order_by,
        from_date,
        to_date,
        archived,
        contestAddress,
        status,
        withXRecentComments = 0,
      } = payload;

      if (stage && status)
        throw new InvalidInput('Cannot provide both stage and status');

      if (status && !contestAddress)
        throw new InvalidInput(
          'Must provide contestAddress if status is provided',
        );

      // query params that bind to sql query
      const _limit = limit ? Math.min(limit, 500) : 20;
      const _page = page || 1;
      const replacements = {
        page: _page,
        limit: _limit,
        offset: _limit * (_page - 1) || 0,
        from_date,
        to_date: to_date || moment().toISOString(),
        community_id,
        stage,
        topic_id,
        contestAddress,
        status,
        withXRecentComments:
          withXRecentComments > 10 ? 10 : withXRecentComments, // cap to 10
      };

      // sql query parts that order results by provided query param
      const orderByQueries = {
        newest: 'created_at DESC',
        oldest: 'created_at ASC',
        mostLikes: 'reaction_count DESC',
        mostComments: 'comment_count DESC',
        latestActivity: 'updated_at DESC',
      };

      const contestStatus = {
        active: ' AND CON.end_time > NOW()',
        pastWinners: ' AND CON.end_time <= NOW()',
        all: '',
      };

      const responseThreadsQuery = models.sequelize.query<
        z.infer<typeof schemas.MappedThread>
      >(
        `
            WITH contest_ids as (
                SELECT DISTINCT(CA.thread_id)
                FROM "Contests" CON
                JOIN "ContestActions" CA ON CON.contest_id = CA.contest_id
                ${
                  contestAddress
                    ? ` WHERE CA.contest_address = '${contestAddress}' `
                    : ''
                }
                ${contestAddress ? contestStatus[status!] || contestStatus.all : ''}
            ),
            top_threads AS (
            SELECT id, title, url, body, kind, stage, read_only, discord_meta,
                pinned, community_id, T.created_at, updated_at, locked_at as thread_locked, links,
                has_poll, last_commented_on, comment_count as "numberOfComments",
                marked_as_spam_at, archived_at, topic_id, reaction_weights_sum, canvas_signed_data,
                canvas_msg_id, last_edited, address_id
            FROM "Threads" T
            WHERE
                community_id = :community_id AND
                deleted_at IS NULL AND
                archived_at IS ${archived ? 'NOT' : ''} NULL
                ${topic_id ? ' AND topic_id = :topic_id' : ''}
                ${stage ? ' AND stage = :stage' : ''}
                ${from_date ? ' AND T.created_at > :from_date' : ''}
                ${to_date ? ' AND T.created_at < :to_date' : ''}
                ${contestAddress ? ' AND id IN (SELECT * FROM "contest_ids")' : ''}
            ORDER BY pinned DESC, ${orderByQueries[order_by ?? 'newest']}
            LIMIT :limit OFFSET :offset
        ), thread_metadata AS (
        -- get the thread authors and their profiles
            SELECT
                TH.id as thread_id,
                json_build_object(
                    'id', T.id,
                    'name', T.name,
                    'description', T.description,
                    'communityId', T.community_id,
                    'telegram', T.telegram
                ) as topic,
                json_build_object(
                    'id', A.id,
                    'address', A.address,
                    'community_id', A.community_id
                ) as "Address",
                U.id as user_id,
                A.last_active as address_last_active,
                U.profile->>'avatar_url' as avatar_url,
                U.profile->>'name' as profile_name
            FROM top_threads TH JOIN "Topics" T ON TH.topic_id = T.id
            LEFT JOIN "Addresses" A ON TH.address_id = A.id
            LEFT JOIN "Users" U ON A.user_id = U.id
        ), collaborator_data AS (
        -- get the thread collaborators and their profiles
            SELECT
                TT.id as thread_id,
                CASE WHEN max(A.id) IS NOT NULL THEN
                    json_agg(json_strip_nulls(json_build_object(
                        'address', A.address,
                        'community_id', A.community_id,
                        'User', json_build_object(
                          'id', editor_profiles.id,
                          'profile', json_build_object(
                            'userId', editor_profiles.id,
                            'name', editor_profiles.profile->>'name',
                            'address', A.address,
                            'lastActive', A.last_active::text,
                            'avatarUrl', editor_profiles.profile->>'avatar_url'
                          )
                        )
                    )))
                ELSE '[]'::json
                END AS collaborators
            FROM top_threads TT LEFT JOIN "Collaborations" AS C ON TT.id = C.thread_id
            LEFT JOIN "Addresses" A ON C.address_id = A.id
            LEFT JOIN "Users" editor_profiles ON A.user_id = editor_profiles.id
            GROUP BY TT.id
        ), reaction_data AS (
        -- get the thread reactions and the address/profile of the user who reacted
            SELECT
                TT.id as thread_id,
                json_agg(json_strip_nulls(json_build_object(
                'id', R.id,
                'type', R.reaction,
                'address', A.address,
                'updated_at', R.updated_at::text,
                'voting_weight', R.calculated_voting_weight,
                'profile_name', U.profile->>'name',
                'avatar_url', U.profile->>'avatar_url',
                'last_active', A.last_active::text
            ))) as "associatedReactions"
            FROM "Reactions" R JOIN top_threads TT ON TT.id = R.thread_id
            JOIN "Addresses" A ON A.id = R.address_id
            JOIN "Users" U ON U.id = A.user_id
            -- where clause doesn't change query result but forces DB to use the correct indexes
            WHERE R.thread_id = TT.id
            GROUP BY TT.id
        ), contest_data AS (
          -- get the contest data associated with the thread
            SELECT
                TT.id as thread_id,
                json_agg(json_strip_nulls(json_build_object(
                'contest_id', CON.contest_id,
                'contest_name', CM.name,
                'contest_cancelled', CM.cancelled,
                'contest_interval', CM.interval,
                'contest_address', CON.contest_address,
                'score', CON.score,
                'thread_id', TT.id,
                'content_id', CA.content_id,
                'start_time', CON.start_time,
                'end_time', CON.end_time
            ))) as "associatedContests"
            FROM "Contests" CON
            JOIN "ContestManagers" CM ON CM.contest_address = CON.contest_address
            JOIN "ContestActions" CA ON CON.contest_id = CA.contest_id
            AND CON.contest_address = CA.contest_address AND CA.action = 'upvoted'
            JOIN top_threads TT ON TT.id = CA.thread_id
            GROUP BY TT.id
        )${
          withXRecentComments
            ? `, recent_comments AS (
          -- get the recent comments data associated with the thread
              SELECT
                  TT.id as thread_id,
                  json_agg(json_strip_nulls(json_build_object(
                  'id', COM.id,
                  'address', A.address,
                  'text', COM.text,
                  'created_at', COM.created_at::text,
                  'updated_at', COM.updated_at::text,
                  'deleted_at', COM.deleted_at::text,
                  'marked_as_spam_at', COM.marked_as_spam_at::text,
                  'discord_meta', COM.discord_meta,
                  'profile_name', U.profile->>'name',
                  'profile_avatar', U.profile->>'avatar_url',
                  'user_id', U.id
              ))) as "recentComments"
              FROM (
                Select tempC.* FROM "Comments" tempC
                JOIN top_threads tempTT ON tempTT.id = tempC.thread_id
                WHERE deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT :withXRecentComments
              ) COM
              JOIN top_threads TT ON TT.id = COM.thread_id
              JOIN "Addresses" A ON A.id = COM.address_id
              JOIN "Users" U ON U.id = A.user_id
              GROUP BY TT.id
          )`
            : ''
        }
        SELECT
            TT.*, TM.*, CD.*, RD.*, COND.*
            ${withXRecentComments ? `, RC.*` : ''}
        FROM top_threads TT
        LEFT JOIN thread_metadata TM ON TT.id = TM.thread_id
        LEFT JOIN collaborator_data CD ON TT.id = CD.thread_id
        LEFT JOIN reaction_data RD ON TT.id = RD.thread_id
        LEFT JOIN contest_data COND ON TT.id = COND.thread_id
        ${
          withXRecentComments
            ? `LEFT JOIN recent_comments RC ON TT.id = RC.thread_id;`
            : ''
        }
      `,
        {
          replacements,
          type: QueryTypes.SELECT,
        },
      );

      const numVotingThreadsQuery = models.Thread.count({
        where: {
          community_id,
          stage: 'voting',
        },
      });

      const [threads, numVotingThreads] = await Promise.all([
        responseThreadsQuery,
        numVotingThreadsQuery,
      ]);

      return {
        limit: replacements.limit,
        page: replacements.page,
        threads,
        numVotingThreads,
      };
    },
  };
}
