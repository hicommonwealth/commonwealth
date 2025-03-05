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
    body: async ({ actor, payload }) => {
      const whereClause = payload.distributed_token_address
        ? 'AND F.distributed_token_address = :distributed_token_address'
        : '';

      return await models.sequelize.query<
        z.infer<typeof schemas.ReferralFeesView>
      >(
        `
WITH 
R AS (
  SELECT DISTINCT address FROM "Addresses"
  WHERE user_id = :user_id AND address LIKE '0x%'
)
SELECT
  F.eth_chain_id,
  F.transaction_hash,
  F.namespace_address,
  F.distributed_token_address,
  F.referrer_recipient_address,
  referrer_received_amount,
  transaction_timestamp,
  F.referee_address,
  C.id AS community_id,
  C.name AS community_name,
  C.icon_url AS community_icon_url,
  U.profile AS referee_profile
FROM 
  "ReferralFees" F
  JOIN R ON F.referrer_recipient_address = R.address
  LEFT JOIN "Communities" C ON F.namespace_address = C.namespace_address
  LEFT JOIN "Addresses" A ON A.community_id = C.id AND A.address = F.referee_address
  LEFT JOIN "Users" U ON U.id = A.user_id
WHERE 1=1 ${whereClause};
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: {
            user_id: actor.user.id,
            distributed_token_address: payload.distributed_token_address,
          },
        },
      );
    },
  };
}
