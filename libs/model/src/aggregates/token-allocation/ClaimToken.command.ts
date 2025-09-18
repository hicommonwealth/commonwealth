import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { MagnaClaim } from 'model/src/services/magna/types';
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
        magna_claimed_at: Date | null;
        magna_claim_data: string | null;
        magna_claim_tx_hash: string | null;
      }>(
        `
          SELECT
            C.magna_allocation_id,
            C.magna_claimed_at,
            C.magna_claim_data,
            C.magna_claim_tx_hash
          FROM
            "ClaimAddresses" C
          WHERE
            C.user_id = :user_id
            AND C.magna_allocation_id = :allocation_id;
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            user_id: actor.user.id,
            allocation_id,
          },
        },
      );
      if (!claim)
        throw new InvalidState(
          'Claim not found!. Make sure you are connected to the correct address.',
        );

      if (!claim.magna_claimed_at || !claim.magna_claim_data) {
        // call the token allocation service
        const response = await claimAllocation(claim.magna_allocation_id, {
          sender: actor.address!,
        });

        if (response.isProcessed && response.result.length > 0) {
          // acknowledge the claim
          const claim_data = response.result[0];
          await models.sequelize.query(
            `
          UPDATE "ClaimAddresses"
          SET 
            magna_claimed_at = NOW(),
            magna_claim_data = :claim_data
          WHERE
            user_id = :user_id`,
            {
              type: QueryTypes.UPDATE,
              replacements: {
                user_id: actor.user.id,
                claim_data: JSON.stringify(claim_data),
              },
            },
          );
          return {
            magna_allocation_id: claim.magna_allocation_id,
            from: claim_data.from as `0x${string}`,
            to: claim_data.to as `0x${string}`,
            data: claim_data.data,
            platform_fee: claim_data.platformFee,
            transaction_hash: null,
          };
        }
        throw new InvalidState('Claim failed!', response.errors);
      }

      // idempotent reponse to claim
      const claim_data = JSON.parse(claim.magna_claim_data) as MagnaClaim;
      return {
        magna_allocation_id: claim.magna_allocation_id,
        from: claim_data.from as `0x${string}`,
        to: claim_data.to as `0x${string}`,
        data: claim_data.data,
        platform_fee: claim_data.platformFee,
        transaction_hash: claim.magna_claim_tx_hash as `0x${string}`,
      };
    },
  };
}
