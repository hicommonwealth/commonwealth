import { type Command, InvalidState, logger } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

const log = logger(import.meta);

export function UpdateClaimAddress(): Command<
  typeof schemas.UpdateClaimableAddress
> {
  return {
    ...schemas.UpdateClaimableAddress,
    auth: [],
    body: async ({ payload }) => {
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

      if (!address) {
        throw new InvalidState('Address not found!');
      } else if (!address.community_id) {
        throw new InvalidState('Invalid EVM address!');
      }

      try {
        await models.sequelize.query(
          `
          INSERT INTO "ClaimAddresses"
          VALUES (:user_id, :address)
          ON CONFLICT DO UPDATE SET address = EXCLUDED.address;
        `,
          {
            type: QueryTypes.UPSERT,
            replacements: {
              user_id: address.user_id,
              address: address.address,
            },
          },
        );
      } catch (error) {
        log.error('Failed to update claim_address', error as Error);
        throw new Error('Failed to update claim_address');
      }

      return {
        claim_address: address.address,
      };
    },
  };
}
