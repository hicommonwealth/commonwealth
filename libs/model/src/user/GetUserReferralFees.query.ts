import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetUserReferralFees(): Query<
  typeof schemas.GetUserReferralFees
> {
  return {
    ...schemas.GetUserReferralFees,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return await models.sequelize.query<
        z.infer<typeof schemas.ReferralFeesView>
      >(
        `
WITH 
referrer_addresses AS (
  SELECT DISTINCT address
  FROM "Addresses"
  WHERE user_id = :user_id AND address LIKE '0x%'
)
SELECT
  eth_chain_id,
  transaction_hash,
  namespace_address,
  distributed_token_address,
  referrer_recipient_address,
  referrer_received_amount,
  CAST(transaction_timestamp AS DOUBLE PRECISION) as transaction_timestamp
FROM "ReferralFees"
WHERE referrer_recipient_address IN (SELECT * FROM referrer_addresses);
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: {
            user_id: actor.user.id,
          },
        },
      );
    },
  };
}
