import { InvalidState, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function GetClaimAddress(): Query<typeof schemas.GetClaimAddress> {
  return {
    ...schemas.GetClaimAddress,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const claimAddress = await models.sequelize.query<{
        user_id: number;
        address: string;
      }>(
        `
          SELECT user_id, address
          FROM "ClaimAddresses"
          WHERE user_id = :user_id
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

      const address = await models.Address.findOne({
        where: {
          user_id: actor.user.id,
          address: claimAddress[0].address,
        },
      });

      if (address) return address;
      else return claimAddress;
    },
  };
}
