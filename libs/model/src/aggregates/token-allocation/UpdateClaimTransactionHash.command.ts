import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';
import { validateClaimTxnHash } from '../../utils/validateClaimTxnHash';

export function UpdateClaimTransactionHash(): Command<
  typeof schemas.UpdateClaimTransactionHash
> {
  return {
    ...schemas.UpdateClaimTransactionHash,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { transaction_hash } = payload;

      const txnAt = await validateClaimTxnHash(transaction_hash);

      const [, updated] = await models.sequelize.query(
        `
          UPDATE "ClaimAddresses"
          SET 
            magna_claim_tx_hash = :transaction_hash,
            magna_claim_tx_at = :transaction_at
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
            transaction_at: txnAt,
          },
        },
      );

      return updated > 0;
    },
  };
}
