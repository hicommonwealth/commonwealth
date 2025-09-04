import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { claimMagnaAllocation } from 'model/src/services/magna/api';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function ClaimToken(): Command<typeof schemas.ClaimToken> {
  return {
    ...schemas.ClaimToken,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { address, allocation_id } = payload;

      // verify there is a valid claim
      const [claim] = await models.sequelize.query<{
        magna_allocation_id: string;
      }>(
        `
          SELECT C.magna_allocation_id
          FROM "ClaimAddresses" C
          WHERE C.address = :address
            AND C.user_id = :user_id
            AND C.magna_allocation_id = :allocation_id
            AND C.magna_claimed_at IS NULL
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            address,
            user_id: actor.user.id,
            allocation_id,
          },
        },
      );
      if (!claim) throw new InvalidState('Claim not found!');

      // call the token allocation service
      const response = await claimMagnaAllocation(claim.magna_allocation_id, {
        sender: address,
      });

      if (response.isProcessed) {
        // acknowledge the claim
        await models.sequelize.query(
          `
        UPDATE "ClaimAddresses" SET magna_claimed_at = NOW() WHERE user_id = :user_id
      `,
          {
            type: QueryTypes.UPDATE,
            replacements: { user_id: actor.user.id },
          },
        );
        return {
          transaction_id: response.result.parameters.transactionId,
          instructions: response.result.parameters.instructions,
        };
      }
      throw new InvalidState('Claim failed!', response.errors);
    },
  };
}
