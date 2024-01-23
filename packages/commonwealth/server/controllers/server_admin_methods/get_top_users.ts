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

export type GetTopUsersResult = {
  top_activity: number;
  thread_count: number;
  comment_count: number;
  user_id: number;
  profile_id: number;
  profile_name: string;
  address_ids: number[];
  community_ids: string[];
}[];

export async function __getTopUsers(
  this: ServerAdminController,
  { user }: GetTopUsersOptions,
): Promise<GetTopUsersResult> {
  if (!user.isAdmin) {
    throw new AppError(Errors.NotAdmin);
  }

  const sql = `
    WITH UserActivity AS (
        SELECT
            u.id AS user_id,
            p.id AS profile_id,
            a.id AS address_id,
            p.profile_name as profile_name,
            a.community_id,
            COUNT(DISTINCT t.id) AS thread_count,
            COUNT(DISTINCT c.id) AS comment_count
        FROM
            "Users" u
        LEFT JOIN "Profiles" p ON u.id = p.user_id
        LEFT JOIN "Addresses" a ON u.id = a.user_id
        LEFT JOIN "Threads" t ON a.id = t.address_id
        LEFT JOIN "Comments" c ON a.id = c.address_id
        GROUP BY
            u.id, p.id, p.profile_name, a.id, a.community_id
    ),
    RankedUsers AS (
        SELECT
            user_id,
            profile_id,
            profile_name,
            thread_count,
            comment_count,
            array_agg(address_id) AS addresses_ids,
            array_agg(community_id) AS community_ids,
            SUM(thread_count + comment_count) AS total_activity
        FROM
            UserActivity
        GROUP BY
            user_id, profile_id, profile_name, thread_count, comment_count
      HAVING
          NOT ('edgeware' = ANY(array_agg(community_id)) OR 'commonwealth' = ANY(array_agg(community_id)))
      ORDER BY
        total_activity DESC
    )
    SELECT
        total_activity,
        thread_count,
        comment_count,
        user_id,
        profile_id,
        profile_name,
        array_to_string(addresses_ids, '|') as address_ids,
        array_to_string(community_ids, '|') as community_ids
    FROM
        RankedUsers
    LIMIT 150;
  `;

  const result = await this.models.sequelize.query<GetTopUsersResult[0]>(sql, {
    type: QueryTypes.SELECT,
  });

  return result;
}
