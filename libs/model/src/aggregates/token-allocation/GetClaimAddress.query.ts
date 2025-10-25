import { InvalidState, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { config } from '../../config';
import { models } from '../../database';

export function GetClaimAddress(): Query<typeof schemas.GetClaimAddress> {
  return {
    ...schemas.GetClaimAddress,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      if (!config.CLAIMS?.ENABLED) throw new InvalidState('Claims not enabled');

      const claimAddress = await models.sequelize.query<
        z.infer<typeof schemas.ClaimAddressView>
      >(
        `
          WITH nft_data AS (
            SELECT user_id, SUM(total_token_allocation) as total_token_allocation
            FROM "NftSnapshot"
            WHERE user_id IS NOT NULL
            GROUP BY user_id
          )
          SELECT
            A.user_id,
            A.address,
            A.magna_allocation_id,
            A.magna_synced_at,
            A.magna_claimed_at,
            A.magna_claim_tx_hash,
            A.magna_claim_tx_at,
            A.magna_claim_tx_status,
            A.magna_claim_tx_finalized,
            A.magna_cliff_claimed_at,
            A.magna_cliff_claim_tx_hash,
            A.magna_cliff_claim_tx_at,
            A.magna_cliff_claim_tx_status,
            A.magna_cliff_claim_tx_finalized,
            COALESCE(HA.token_allocation, 0)::numeric 
            + COALESCE(AA.token_allocation, 0)::numeric
            + COALESCE(NA.total_token_allocation, 0)::numeric as tokens
          FROM
            "ClaimAddresses" A
            LEFT JOIN "HistoricalAllocations" HA ON A.user_id = HA.user_id
            LEFT JOIN "AuraAllocations" AA ON A.user_id = AA.user_id
            LEFT JOIN nft_data NA ON A.user_id = NA.user_id
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

      if (!claimAddress || claimAddress.length === 0) return null;
      if (claimAddress.length > 1) {
        // this will never happen but included for type-narrowing
        throw new InvalidState('Duplicate claim addresses found');
      }

      return {
        ...claimAddress[0],
        token: config.MAGNA.TOKEN,
        token_address: config.MAGNA.TOKEN_ADDRESS as `0x${string}`,
        description: config.MAGNA.EVENT_DESC,
        initial_percentage: config.MAGNA.INITIAL_PERCENTAGE,
        unlock_start_at: config.MAGNA.UNLOCK_START_AT,
        cliff_date: config.MAGNA.CLIFF_DATE,
      };
    },
  };
}
