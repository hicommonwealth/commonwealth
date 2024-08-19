import { Transaction } from 'sequelize';

export const incrementProfileCount = async (
  models: any,
  community_id: string,
  user_id: number,
  transaction?: Transaction,
) => {
  await models.sequelize.query(
    `
      UPDATE "Communities" as c
      SET profile_count = profile_count + 1
      WHERE c.id = :community_id
      AND NOT EXISTS (
        SELECT 1
        FROM "Addresses" as a
        WHERE a.community_id = c.id AND a.user_id = :user_id AND a.verified IS NOT NULL
      );
    `,
    {
      replacements: { community_id, user_id },
      transaction,
    },
  );
};

export const decrementProfileCount = async (
  models: any,
  community_id: string,
  user_id: number,
  transaction: Transaction,
) => {
  await models.sequelize.query(
    `
      UPDATE "Communities" as c
      SET profile_count = profile_count - 1
      WHERE c.id = :community_id
      AND NOT EXISTS (
        SELECT 1
        FROM "Addresses" as a
        WHERE a.community_id = c.id AND a.user_id = :user_id AND a.verified IS NOT NULL
      );
    `,
    {
      replacements: {
        community_id: community_id,
        user_id: user_id,
      },
      transaction: transaction,
    },
  );
};
