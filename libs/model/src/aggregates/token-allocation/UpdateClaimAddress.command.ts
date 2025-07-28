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
      const { address_id } = payload;

      const [address] = await models.sequelize.query<{
        user_id: number;
        address: `0x${string}`;
        community_id: number;
      }>(
        `
          SELECT A.user_id, A.address, C.id as community_id
          FROM "Addresses" A
                 LEFT JOIN "Communities" C ON C.id = A.community_id
          WHERE A.id = :address_id
            AND C.network = 'ethereum'
            AND C.base = 'ethereum'
            AND A.address LIKE '0x%'
            AND LENGTH(A.address) = 42;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            address_id,
          },
        },
      );

      if (address.user_id !== actor.user.id) {
        throw new InvalidActor(actor, 'Cannot update claim address');
      }

      if (!address) {
        throw new InvalidState('Address not found!');
      } else if (!address.community_id) {
        throw new InvalidState('Invalid EVM address!');
      }

      const result = await models.sequelize.query<{ address: string }>(
        `
          WITH magna_check AS (
            SELECT EXISTS (
              SELECT 1 FROM "HistoricalAllocations"
              WHERE user_id = :user_id 
              AND magna_synced_at IS NOT NULL
              FOR UPDATE
            ) as is_synced
          )
          INSERT INTO "ClaimAddresses" (user_id, address, created_at, updated_at)
          SELECT :user_id, :address, NOW(), NOW()
          WHERE NOT (SELECT is_synced FROM magna_check)
          ON CONFLICT (user_id) DO UPDATE SET address = EXCLUDED.address, updated_at = NOW()
          RETURNING address;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            user_id: address.user_id,
            address: address.address,
          },
        },
      );

      if (result.length === 0) {
        throw new InvalidState(
          'Cannot update claim address after user has been synchronized with magna',
        );
      }

      return {
        claim_address: address.address,
      };
    },
  };
}
