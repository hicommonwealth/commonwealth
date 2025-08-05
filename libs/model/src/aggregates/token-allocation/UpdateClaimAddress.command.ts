import { type Command, InvalidActor, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function UpdateClaimAddress(): Command<
  typeof schemas.UpdateClaimAddress
> {
  return {
    ...schemas.UpdateClaimAddress,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { address } = payload;

      const [addr] = await models.sequelize.query<{
        user_id: number;
        address: `0x${string}`;
        community_id: number;
      }>(
        `
          SELECT A.user_id, A.address, C.id as community_id
          FROM "Addresses" A
                 LEFT JOIN "Communities" C ON C.id = A.community_id
          WHERE A.address = :address
            AND C.network = 'ethereum'
            AND C.base = 'ethereum'
            AND A.address LIKE '0x%'
            AND LENGTH(A.address) = 42;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { address },
        },
      );

      if (!addr) throw new InvalidState('Address not found!');
      if (!addr.community_id) throw new InvalidState('Invalid EVM address!');
      if (addr.user_id !== actor.user.id)
        throw new InvalidActor(
          actor,
          'Cannot update claim address. User mismatch.',
        );

      const result = await models.sequelize.query<{ address: string }>(
        `
          INSERT INTO "ClaimAddresses" (user_id, address, created_at, updated_at)
          SELECT :user_id, :address, NOW(), NOW()
          ON CONFLICT (user_id) DO
          UPDATE SET address = EXCLUDED.address, updated_at = NOW()
          WHERE "ClaimAddresses".magna_synced_at IS NULL
          RETURNING address;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            user_id: addr.user_id,
            address: addr.address,
          },
        },
      );

      if (result.length === 0)
        throw new InvalidState(
          'Cannot update claim address after user has been synchronized with magna',
        );

      return {
        claim_address: addr.address,
      };
    },
  };
}
