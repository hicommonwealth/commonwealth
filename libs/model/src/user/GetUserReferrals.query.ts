import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

const sql = `
WITH 
referrer_addresses AS (
  SELECT DISTINCT address
  FROM "Addresses"
  WHERE user_id = :user_id AND address LIKE '0x%'),
referrals AS (
  SELECT
    namespace_address,
    referrer_address,
    referee_address,
    eth_chain_id,
    transaction_hash,
    referrer_received_eth_amount,
    created_on_chain_timestamp,
    created_at,
    updated_at
  FROM "Referrals"
  WHERE referrer_address IN (SELECT * FROM referrer_addresses)),
referee_addresses AS (
  SELECT DISTINCT A.address, A.user_id
  FROM "Addresses" A
  JOIN referrals ON referee_address = A.address
)
SELECT 
  R.*,
  U.id as referee_user_id, 
  U.profile as referee_profile,
  C.id as community_id,
  C.name as community_name,
  C.icon_url as community_icon_url
FROM referrals R
  JOIN referee_addresses RA ON RA.address = R.referee_address
  JOIN "Users" U ON U.id = RA.user_id
  LEFT JOIN "Communities" C ON C.namespace = R.namespace_address
  ;
`;

export function GetUserReferrals(): Query<typeof schemas.GetUserReferrals> {
  return {
    ...schemas.GetUserReferrals,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      // only super admin can get referrals for all users
      const id =
        actor.user.isAdmin && payload.user_id ? payload.user_id : actor.user.id;
      const result = await models.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: { user_id: id },
      });
      return result as Array<z.infer<typeof schemas.ReferralView>>;
    },
  };
}
