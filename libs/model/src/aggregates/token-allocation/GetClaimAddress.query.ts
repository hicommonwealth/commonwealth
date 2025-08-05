import { InvalidState, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';

export function GetClaimAddress(): Query<typeof schemas.GetClaimAddress> {
  return {
    ...schemas.GetClaimAddress,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const claimAddress = await models.sequelize.query<
        z.infer<typeof schemas.ClaimAddressView>
      >(
        `
          SELECT
            A.user_id,
            A.address,
            H.magna_synced_at
          FROM
            "ClaimAddresses" A
            LEFT JOIN "HistoricalAllocations" H ON H.user_id = A.user_id
          WHERE
            A.user_id = :user_id
          LIMIT 1;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            user_id: actor.user.id,
          },
        },
      );

      if (!claimAddress || claimAddress.length === 0) return;
      if (claimAddress.length > 1) {
        // this will never happen but included for type-narrowing
        throw new InvalidState('Duplicate claim addresses found');
      }

      return claimAddress[0];
    },
  };
}
