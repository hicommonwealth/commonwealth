import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptional } from '../../middleware';
import { filterGates, joinGates, withGates } from '../../utils/gating';

export function GetActiveThreads(): Query<typeof schemas.GetActiveThreads> {
  return {
    ...schemas.GetActiveThreads,
    auth: [authOptional],
    secure: true,
    body: async ({ context, payload }) => {
      const { community_id, threads_per_topic, withXRecentComments } = payload;
      const address_id = context?.address?.id;

      const sql = `
${withGates(address_id)},
TH AS (
	SELECT
		T.id,
		T.title,
		T.url,
		T.body,
		T.kind,
		T.stage,
		T.READ_ONLY,
		T.discord_meta,
		T.content_url,
		T.pinned,
		T.community_id,
		T.created_at,
		T.updated_at,
		T.locked_at AS thread_locked,
		T.links,
		T.has_poll,
		T.last_commented_on,
		T.comment_count,
		T.marked_as_spam_at,
		T.archived_at,
		T.topic_id,
		T.reaction_weights_sum,
		T.canvas_signed_data,
		T.canvas_msg_id,
		T.last_edited,
		T.address_id,
		T.reaction_count,
		row_number() OVER (
      PARTITION BY T.topic_id ORDER BY T.created_at DESC,	T.last_commented_on DESC) AS topic_rank
	FROM
		"Threads" T
    ${joinGates(address_id)}
	WHERE
		community_id = :community_id
		AND deleted_at IS NULL
		AND archived_at IS NULL
		${filterGates(address_id)}
),
T AS ( -- select top by topic and get the thread authors and their profiles
SELECT
  TH.*,
  json_build_object(
    'id', T.id,
    'name', T.name,
    'description', T.description,
    'community_id', T.community_id,
    'telegram', T.telegram,
    'weighted_voting', T.weighted_voting,
    'token_decimals', T.token_decimals,
    'vote_weight_multiplier', T.vote_weight_multiplier
  ) as topic,
  json_build_object(
    'id', A.id,
    'address', A.address,
    'community_id', A.community_id
  ) as "Address",
  U.id as user_id,
  U.tier as user_tier,
  A.last_active as address_last_active,
  U.profile->>'avatar_url' as avatar_url,
  U.profile->>'name' as profile_name
FROM
  TH
  JOIN "Topics" T ON TH.topic_id = T.id
  JOIN "Addresses" A ON TH.address_id = A.id
  JOIN "Users" U ON A.user_id = U.id
WHERE
  TH.topic_rank <= :threads_per_topic
ORDER BY
  TH.created_at DESC,
  TH.last_commented_on DESC
), 
collaborator_data AS ( -- get the thread collaborators and their profiles
  SELECT
    T.id as thread_id,
    CASE WHEN max(A.id) IS NOT NULL THEN
        json_agg(json_strip_nulls(json_build_object(
          'id', editor_profiles.id,
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
            ),
            'tier', editor_profiles.tier
          )
        )))
      ELSE '[]'::json
    END AS collaborators
  FROM
    T
    LEFT JOIN "Collaborations" AS C ON T.id = C.thread_id
    LEFT JOIN "Addresses" A ON C.address_id = A.id
    LEFT JOIN "Users" editor_profiles ON A.user_id = editor_profiles.id
  GROUP BY
    T.id
)
${
  withXRecentComments
    ? `, recent_comments AS ( -- get the recent comments data associated with the thread
      SELECT
        T.id as thread_id,
        json_agg(json_strip_nulls(json_build_object(
        'id', COM.id,
        'address', A.address,
        'body', COM.body,
        'created_at', COM.created_at::text,
        'updated_at', COM.updated_at::text,
        'deleted_at', COM.deleted_at::text,
        'marked_as_spam_at', COM.marked_as_spam_at::text,
        'discord_meta', COM.discord_meta,
        'profile_name', U.profile->>'name',
        'profile_avatar', U.profile->>'avatar_url',
        'user_id', U.id,
        'user_tier', U.tier,
        'content_url', COM.content_url
      ))) as "recentComments"
      FROM (
        Select tempC.* FROM "Comments" tempC
        JOIN T tempTT ON tempTT.id = tempC.thread_id
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT :withXRecentComments
      ) COM
      JOIN T ON T.id = COM.thread_id
      JOIN "Addresses" A ON A.id = COM.address_id
      JOIN "Users" U ON U.id = A.user_id
      GROUP BY T.id
  )`
    : ''
}
SELECT
  T.*, CD.*${withXRecentComments ? `, RC.*` : ''}
  FROM
    T
    LEFT JOIN collaborator_data CD ON T.id = CD.thread_id
    ${withXRecentComments ? `LEFT JOIN recent_comments RC ON T.id = RC.thread_id;` : ''}
`;

      return await models.sequelize.query<z.infer<typeof schemas.ThreadView>>(
        sql,
        {
          replacements: {
            community_id,
            address_id,
            threads_per_topic: threads_per_topic || 3,
            withXRecentComments,
          },
          type: QueryTypes.SELECT,
        },
      );
    },
  };
}
