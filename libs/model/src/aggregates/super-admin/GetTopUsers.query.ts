import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function GetTopUsers(): Query<typeof schemas.GetTopUsers> {
  return {
    ...schemas.GetTopUsers,
    auth: [isSuperAdmin],
    secure: true,
    body: async () => {
      const sql = `
  WITH Stats as (
    SELECT
      u.profile->>'name' AS profile_name,
      u.id as user_id,
      COUNT(DISTINCT t.id) AS thread_count,
      COUNT(DISTINCT c.id) AS comment_count,
      COUNT(DISTINCT c.id) + COUNT(DISTINCT t.id) AS total_activity,
      ARRAY_AGG(DISTINCT a.community_id ORDER BY a.community_id) AS community_ids,
      ARRAY_AGG(DISTINCT a.address ORDER BY a.address) AS addresses,
      MAX(a.last_active) as last_active,
      MAX(t.created_at) as last_thread_created_at,
      MAX(c.created_at) as last_comment_created_at
    FROM
      "Users" AS u
      LEFT JOIN "Addresses" AS a ON u.id = a.user_id
      LEFT JOIN "Threads" AS t ON a.id = t.address_id
      LEFT JOIN "Comments" AS c ON a.id = c.address_id
    WHERE u."isAdmin" = FALSE
    GROUP BY u.profile->>'name', u.id
    ORDER BY total_activity DESC
    LIMIT 150
  )
  SELECT
    user_id as "User ID",
    profile_name as "Profile Name",
    CAST(thread_count as INTEGER) as "Threads Count",
    CAST(comment_count as INTEGER) as "Comments Count",
    CAST(total_activity as INTEGER) as "Total Activity",
    array_to_string(addresses, ' | ') as "Addresses",
    array_to_string(community_ids, ' | ') as "Community IDs",
	GREATEST(last_thread_created_at, last_comment_created_at, last_active) as "Last Active At",
	CURRENT_DATE - GREATEST(last_thread_created_at, last_comment_created_at, last_active)::date as "Last Active Days Ago"
  FROM Stats
  `;

      return await models.sequelize.query(sql, {
        type: QueryTypes.SELECT,
      });
    },
  };
}
