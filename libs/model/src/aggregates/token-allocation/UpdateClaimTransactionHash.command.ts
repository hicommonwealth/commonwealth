import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';

export function UpdateClaimTransactionHash(): Command<
  typeof schemas.UpdateClaimTransactionHash
> {
  return {
    ...schemas.UpdateClaimTransactionHash,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { transaction_hash } = payload;

      const [, updated] = await models.sequelize.query(
        `
          UPDATE "ClaimAddresses"
          SET magna_claim_tx_hash = :transaction_hash
          WHERE
            user_id = :user_id
            AND magna_claimed_at IS NOT NULL
            AND magna_claim_data IS NOT NULL
            AND magna_claim_tx_hash IS NULL;
        `,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            user_id: actor.user.id,
            transaction_hash,
          },
        },
      );

      return updated > 0;
    },
  };
}
