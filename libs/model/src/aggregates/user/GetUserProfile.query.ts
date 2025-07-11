import { InvalidInput, type Query } from '@hicommonwealth/core';
import {
  GetUserProfile as GetUserProfileSchema,
  UserProfileView,
} from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';
import { authOptionalVerified } from '../../middleware';

export function GetUserProfile(): Query<typeof GetUserProfileSchema> {
  return {
    ...GetUserProfileSchema,
    auth: [authOptionalVerified],
    secure: true,
    body: async ({ actor, payload }) => {
      const actor_id = actor?.user?.id || 0;
      const user_id = payload.userId ?? actor_id;
      if (!user_id) throw new InvalidInput('Missing user id');

      const sql = `
WITH
actor_addresses AS (
  SELECT a.id FROM "Addresses" a WHERE a.user_id = :actor_id
),
user_addresses AS (
  SELECT a.id FROM "Addresses" a WHERE a.user_id = :user_id
),
open_gates AS (
  SELECT T.id as topic_id
  FROM
    user_addresses ua
    JOIN "Addresses" a ON ua.id = a.id
    JOIN "Topics" T ON a.community_id = T.community_id
  	LEFT JOIN "GroupGatedActions" G ON T.id = G.topic_id
  	LEFT JOIN "Memberships" M ON G.group_id = M.group_id
      AND M.address_id IN (SELECT id FROM actor_addresses)
      AND M.reject_reason IS NULL
  GROUP BY
    T.id
  HAVING
    BOOL_AND(
      COALESCE(G.is_private, FALSE) = FALSE
      OR M.address_id IS NOT NULL
      OR ${actor?.user?.isAdmin ? 'TRUE' : 'FALSE'}
    )
),
comments AS (
  SELECT
  	c.*,
  	a.user_id,
  	a.address,
  	a.community_id,
  	a.last_active
  FROM
    "Comments" c
    JOIN user_addresses ua ON ua.id = c.address_id
    JOIN "Addresses" a ON c.address_id = a.id
    JOIN "Threads" t ON c.thread_id = t.id
    LEFT JOIN open_gates og ON t.topic_id = og.topic_id
  WHERE
    t.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND (og.topic_id IS NOT NULL OR a.user_id = :actor_id)
  ORDER BY
    c.created_at DESC
) 
SELECT
  u.id AS "userId",
  u.profile,
  u.tier,
  u.referred_by_address,
  COALESCE(u.referral_count, 0) AS referral_count,
  COALESCE(u.referral_eth_earnings, 0) AS referral_eth_earnings,
  COALESCE(u.xp_points, 0) AS xp_points,
  COALESCE(u.xp_referrer_points, 0) AS xp_referrer_points,
  (
    SELECT json_agg(
      jsonb_build_object(
        'id', ua.id,
        'address', a.address,
        'community_id', a.community_id,
        'Community', jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'base', c.base,
          'ss58_prefix', c.ss58_prefix
        )
      )
    )
    FROM
      user_addresses ua
      JOIN "Addresses" a ON ua.id = a.id
      JOIN "Communities" c ON a.community_id = c.id  
  ) AS "addresses"
  , (
    SELECT
      COUNT(*)::INTEGER
    FROM
      "Reactions" r
      JOIN user_addresses ua ON ua.id = r.address_id
  ) AS "totalUpvotes"
  , (SELECT
      COALESCE(json_agg(jsonb_build_object('id', t.id, 'name', t.name)), '[]'::json)
    FROM
      "ProfileTags" pt
      JOIN "Tags" t ON pt.tag_id = t.id
    WHERE
      pt.user_id = :user_id
  ) AS tags
  , (
    SELECT
      COALESCE(json_agg(jsonb_build_object(
        'id', t.id,
        'address_id', a.id,
        'title', t.title,
        'kind', t.kind,
        'stage', t.stage,
        'body', SUBSTRING(t.body, 1, 200),
        'url', t.url,
        'topic_id', t.topic_id,
        'pinned', t.pinned,
        'community_id', a.community_id,
        'view_count', t.view_count,
        'links', t.links,
        'content_url', t.content_url,
        'read_only', t.read_only,
        'has_poll', t.has_poll,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'last_edited', t.last_edited,
        'deleted_at', t.deleted_at,
        'last_commented_on', t.last_commented_on,
        'marked_as_spam_at', t.marked_as_spam_at,
        'archived_at', t.archived_at,
        'locked_at', t.locked_at,
        'user_tier_at_creation', t.user_tier_at_creation,
        'reaction_count', t.reaction_count,
        'comment_count', t.comment_count,
        'activity_rank_date', t.activity_rank_date,
        'created_by', t.created_by,
        'user_id', u.id,
        'address', a.address,
        'last_active', a.last_active,
        'topic', jsonb_build_object(
          'id', t.topic_id,
          'name', g.name,
          'community_id', g.community_id
        ),
        'Address', jsonb_build_object(
          'id', a.id,
          'address', a.address,
          'community_id', a.community_id,
          'User', jsonb_build_object(
            'id', u.id,
            'profile', u.profile,
            'tier', u.tier            
          )
        )
      )
  	ORDER BY t.created_at DESC), '[]'::json)
    FROM
      "Threads" t
      JOIN user_addresses ua ON ua.id = t.address_id
      JOIN "Addresses" a ON ua.id = a.id
      JOIN "Users" u ON a.user_id = u.id
      JOIN "Topics" g ON t.topic_id = g.id
      LEFT JOIN open_gates og ON t.topic_id = og.topic_id
    WHERE
      t.deleted_at IS NULL 
      AND (og.topic_id IS NOT NULL OR a.user_id = :actor_id)
  ) AS threads
, (
  SELECT COALESCE(json_agg(
    jsonb_build_object(
      'id', c.id,
      'thread_id', c.thread_id,
      'address_id', c.address_id,
      'user_id', c.user_id,
      'address', c.address,
      'last_active', c.last_active,
      'community_id', c.community_id,
      'body', c.body,
      'created_at', c.created_at,
      'comment_level', c.comment_level,
      'reaction_count', c.reaction_count,
      'reply_count', c.reply_count,
      'Address', jsonb_build_object(
        'id', c.address_id,
        'address', c.address,
        'community_id', c.community_id
      ),
      'Thread', jsonb_build_object(
        'id', c.thread_id,
        'community_id', c.community_id
      )
    )
  ), '[]'::json)
  FROM comments c
) as comments
, (
	SELECT
	 COALESCE(json_agg(jsonb_build_object(  
	    'id', t.id,
	    'address_id', a.id,
	    'community_id', a.community_id,
	    'user_id', u.id,
	    'address', a.address,
	    'last_active', a.last_active,
	    'created_at', t.created_at,
	    'title', t.title,
	    'body', '',
      'kind', t.kind,
      'stage', t.stage,
	    'pinned', t.pinned,
      'comment_count', t.comment_count,
      'reaction_count', t.reaction_count,
      'topic_id', t.topic_id,
	    'topic', jsonb_build_object(
	      'id', t.topic_id,
	      'name', g.name,
	      'community_id', g.community_id
	    ),
	    'Address', jsonb_build_object(
	      'id', a.id,
	      'address', a.address,
	      'community_id', a.community_id,
	      'User', jsonb_build_object(
	        'id', u.id,
	        'profile', u.profile,
	        'tier', u.tier            
	      )
	    )
	  )), '[]'::json)
	FROM
	  comments c
	  JOIN "Threads" t ON c.thread_id = t.id
	  JOIN "Addresses" a ON c.address_id = a.id
	  JOIN "Users" u ON a.user_id = u.id
	  JOIN "Topics" g ON t.topic_id = g.id
	WHERE
	  t.deleted_at IS NULL 
) AS "commentThreads"
FROM "Users" u
WHERE u.id = :user_id;
`;
      const [profile] = await models.sequelize.query<
        z.infer<typeof UserProfileView>
      >(sql, {
        replacements: { user_id, actor_id },
        type: QueryTypes.SELECT,
      });

      return {
        ...profile,
        isOwner: actor.user?.id === user_id,
      };
    },
  };
}
