import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';
import { claimAllocation } from '../../services/magna/api';

export function ClaimToken(): Command<typeof schemas.ClaimToken> {
  return {
    ...schemas.ClaimToken,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { allocation_id } = payload;

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
            address: actor.address, // must be authenticated with claim address
            user_id: actor.user.id,
            allocation_id,
          },
        },
      );
      if (!claim)
        throw new InvalidState(
          'Claim not found!. Make sure you are connected to the correct address.',
        );

      // call the token allocation service
      const response = await claimAllocation(claim.magna_allocation_id, {
        sender: actor.address!,
      });

      if (response.isProcessed) {
        // acknowledge the claim
        await models.sequelize.query(
          `
          UPDATE "ClaimAddresses"
          SET magna_claimed_at = NOW()
          WHERE user_id = :user_id`,
          {
            type: QueryTypes.UPDATE,
            replacements: { user_id: actor.user.id },
          },
        );
        return {
          magna_allocation_id: claim.magna_allocation_id,
          transaction_id: response.result.parameters.transactionId,
          instructions: response.result.parameters.instructions,
        };
      }
      throw new InvalidState('Claim failed!', response.errors);
    },
  };
}
