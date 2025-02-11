import { ServerError, logger } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { models } from '../database';

const log = logger(import.meta);

export const refreshProfileCount = async (community_id: string) => {
  await models.sequelize.query(
    `
UPDATE "Communities" C
SET profile_count = (
    SELECT COUNT(*) 
    FROM "Addresses" A 
    WHERE A.community_id = C.id AND A.user_id IS NOT NULL AND A.verified IS NOT NULL
)
WHERE C.id = :community_id;
    `,
    { replacements: { community_id } },
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
