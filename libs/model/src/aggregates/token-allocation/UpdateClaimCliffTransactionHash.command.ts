import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';
import { validateClaimTxnHash } from '../../utils/validateClaimTxnHash';

const log = logger(import.meta);

export function UpdateClaimCliffTransactionHash(): Command<
  typeof schemas.UpdateClaimTransactionHash
> {
  return {
    ...schemas.UpdateClaimTransactionHash,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { event_id, transaction_hash } = payload;

      const claimAddress = await models.ClaimAddresses.findOne({
        where: {
          event_id,
          user_id: actor.user.id,
        },
      });

      if (!claimAddress) {
        log.error('Claim address not found for user', undefined, {
          user_id: actor.user.id,
        });
        throw new InvalidState('Claim address not found');
      }

      if (
        claimAddress.magna_cliff_claim_tx_hash &&
        claimAddress.magna_cliff_claim_tx_at
      ) {
        return false;
      }

      if (!claimAddress.address) {
        throw new InvalidState(
          'Cannot set transaction hash without a claim address',
        );
      }

      const txnAt = await validateClaimTxnHash(
        transaction_hash,
        claimAddress.address,
      );

      const [, updated] = await models.sequelize.query(
        `
          UPDATE "ClaimAddresses"
          SET 
            magna_cliff_claim_tx_hash = :transaction_hash,
            magna_cliff_claim_tx_at = :transaction_at
          WHERE
            event_id = :event_id
            user_id = :user_id
            AND magna_cliff_claimed_at IS NOT NULL
            AND magna_cliff_claim_data IS NOT NULL
            AND magna_cliff_claim_tx_hash IS NULL;
        `,
        {
          type: QueryTypes.UPDATE,
          replacements: {
            event_id,
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
