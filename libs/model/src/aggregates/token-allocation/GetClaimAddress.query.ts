import { type Query } from '@hicommonwealth/core';
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
            CE.id as event_id,
            CE.description,
            CE.token,
            CE.token_address,
            CE.contract_address,
            CE.initial_percentage::float8 as initial_percentage,
            CE.unlock_start_at,
            CE.cliff_date,
            CE.end_registration_date,
            A.user_id,
            A.address,
            A.magna_allocation_id,
            A.magna_synced_at,
            A.magna_claimed_at,
            A.magna_claim_tx_hash,
            A.magna_claim_tx_at,
            A.magna_claim_tx_finalized,
            A.magna_cliff_claimed_at,
            A.magna_cliff_claim_tx_hash,
            A.magna_cliff_claim_tx_at,
            A.magna_cliff_claim_tx_finalized,
            A.aura + A.historic + A.nft as tokens
          FROM
            "ClaimEvents" CE JOIN "ClaimAddresses" A ON A.event_id = CE.id
          WHERE
            A.user_id = :user_id
          ORDER BY
            A.created_at DESC
        `,
        {
          type: QueryTypes.SELECT,
          replacements: {
            user_id: actor.user.id,
          },
        },
      );
      if (!claimAddress || claimAddress.length === 0) return null;
      return claimAddress;
    },
  };
}
