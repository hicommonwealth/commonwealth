import { ServerError, logger } from '@hicommonwealth/core';
import { Op, Transaction } from 'sequelize';
import { models } from '../database';

const log = logger(import.meta);

export const incrementProfileCount = async (
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
  community_id: string,
  user_id: number,
  transaction?: Transaction,
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

// TODO: check if we need a maintenance policy for this
export async function assertAddressOwnership(address: string) {
  const addressUsers = await models.Address.findAll({
    where: {
      address,
      verified: { [Op.ne]: null },
    },
  });
  const numUserIds = new Set(addressUsers.map((au) => au.user_id)).size;
  if (numUserIds !== 1) {
    log.error(`Address ${address} is not owned by a single user!`);
    if (process.env.NODE_ENV !== 'production')
      throw new ServerError('Address failed assertion check');
  }
}
