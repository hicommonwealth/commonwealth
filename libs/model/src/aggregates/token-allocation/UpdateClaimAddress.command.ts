import { InvalidActor, InvalidState, type Command } from '@hicommonwealth/core';
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
      const { event_id, address } = payload;

      const [addr] = await models.sequelize.query<{
        user_id: number;
        address: `0x${string}`;
        community_id: number;
      }>(
        `
          SELECT A.user_id, A.address, C.id as community_id
          FROM "Addresses" A LEFT JOIN "Communities" C ON C.id = A.community_id
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
        ` UPDATE "ClaimAddresses"
          SET address = :address, updated_at = NOW()
          WHERE event_id = :event_id AND user_id = :user_id AND magna_synced_at IS NULL
          RETURNING address;`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            event_id,
            user_id: addr.user_id,
            address: addr.address,
          },
        },
      );

      if (!result || result.length === 0)
        throw new InvalidState(
          'Cannot update claim address after user has been synchronized with magna',
        );

      return {
        claim_address: addr.address,
      };
    },
  };
}
