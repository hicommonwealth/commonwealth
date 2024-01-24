import { AppError } from '@hicommonwealth/adapters';
import { UserInstance } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { ServerAdminController } from '../server_admin_controller';

export const Errors = {
  NotAdmin: 'Must be a site admin',
};

export type GetTopUsersOptions = {
  user: UserInstance;
};

export type GetTopUsersResult = any[];

export async function __getTopUsers(
  this: ServerAdminController,
  { user }: GetTopUsersOptions,
): Promise<GetTopUsersResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const sql = `
  WITH Stats as (
    SELECT
      p.profile_name AS profile_name,
      p.user_id as user_id,
      COUNT(DISTINCT t.id) AS thread_count,
      COUNT(DISTINCT c.id) AS comment_count,
      COUNT(DISTINCT c.id) + COUNT(DISTINCT t.id) AS total_activity,
      ARRAY_AGG(DISTINCT a.community_id ORDER BY a.community_id) AS community_ids,
      ARRAY_AGG(DISTINCT a.address ORDER BY a.address) AS addresses,
      MAX(a.last_active) as last_active,
      MAX(t.created_at) as last_thread_created_at,
      MAX(c.created_at) as last_comment_created_at
    FROM "Profiles" AS p
    LEFT JOIN "Users" AS u ON u.id = p.user_id
    LEFT JOIN "Addresses" AS a ON p.id = a.profile_id
    LEFT JOIN "Threads" AS t ON a.id = t.address_id
    LEFT JOIN "Comments" AS c ON a.id = c.address_id
    WHERE u."isAdmin" = FALSE
    GROUP BY p.id
    ORDER BY total_activity DESC
    LIMIT 150
  )
  SELECT
    profile_name as "Profile Name",
    user_id as "User ID",
    CAST(thread_count as INTEGER) as "Threads Count",
    CAST(comment_count as INTEGER) as "Comments Count",
    CAST(total_activity as INTEGER) as "Total Activity",
    array_to_string(addresses, ' | ') as "Addresses",
    array_to_string(community_ids, ' | ') as "Community IDs",
	GREATEST(last_thread_created_at, last_comment_created_at, last_active) as "Last Active At",
	CURRENT_DATE - GREATEST(last_thread_created_at, last_comment_created_at, last_active)::date as "Last Active Days Ago"
  FROM Stats
  `;

  const result = await this.models.sequelize.query<GetTopUsersResult[0]>(sql, {
    type: QueryTypes.SELECT,
  });

  return result;
}
