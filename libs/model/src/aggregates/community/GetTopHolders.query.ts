import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function GetTopHolders(): Query<typeof schemas.GetTopHolders> {
  return {
    ...schemas.GetTopHolders,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      //const { community_id, limit } = payload;

      // const sql = `
      //   WITH total_balance AS (
      //     SELECT SUM(balance) as total
      //     FROM "Addresses"
      //     WHERE community_id = :community_id
      //       AND EXISTS (
      //         SELECT 1 FROM "Memberships" m
      //         JOIN "Groups" g ON m.group_id = g.id
      //         WHERE g.name = 'holders'
      //           AND g.community_id = :community_id
      //           AND m.address_id = "Addresses".id
      //       )
      //   )
      //   SELECT
      //     u.id as "userId",
      //     a.address,
      //     u.profile_name as name,
      //     a.balance as tokens,
      //     CAST((a.balance::float / NULLIF(tb.total, 0) * 100) as DECIMAL(5,2)) as percentage,
      //     a.role,
      //     u.tier
      //   FROM "Addresses" a
      //   JOIN "Users" u ON a.user_id = u.id
      //   CROSS JOIN total_balance tb
      //   WHERE a.community_id = :community_id
      //     AND EXISTS (
      //       SELECT 1 FROM "Memberships" m
      //       JOIN "Groups" g ON m.group_id = g.id
      //       WHERE g.name = 'holders'
      //         AND g.community_id = :community_id
      //         AND m.address_id = a.id
      //     )
      //   ORDER BY a.balance DESC
      //   LIMIT :limit;
      // `;

      // return await models.sequelize.query<z.infer<typeof schemas.HolderView>>(
      //   sql,
      //   {
      //     replacements: { community_id, limit },
      //     type: QueryTypes.SELECT,
      //   },
      // );

      return [
        {
          user_id: 1,
          address: '0x1234567890abcdef',
          name: 'John Doe',
          tokens: 1000,
          percentage: 10.0,
          role: 'holder',
          tier: 1,
        },
        {
          user_id: 2,
          address: '0x1234567890abcdef',
          name: 'John Doe',
          tokens: 1000,
          percentage: 10.0,
          role: 'holder',
          tier: 2,
        },
        {
          user_id: 3,
          address: '0x1234567890abcdef',
          name: 'John Doe',
          tokens: 1000,
          percentage: 10.0,
          role: 'holder',
          tier: 3,
        },
      ];
    },
  };
}
