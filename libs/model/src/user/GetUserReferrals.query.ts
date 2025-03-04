import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

const sql = `
WITH 
referrer AS (
  SELECT DISTINCT address FROM "Addresses"
  WHERE user_id = :user_id AND address LIKE '0x%'),
referee AS (
  SELECT DISTINCT A.address, A.user_id, U.referred_by_address
  FROM "Users" U
    JOIN referrer ON U.referred_by_address = referrer.address
    JOIN "Addresses" A ON A.user_id = U.id
),
referrals AS (
  SELECT
    namespace_address,
    referrer_address,
    referee_address,
    eth_chain_id,
    transaction_hash,
    referrer_received_eth_amount,
    created_on_chain_timestamp
  FROM "Referrals"
  WHERE referrer_address IN (SELECT * FROM referrer))
SELECT 
  referee.referred_by_address as referrer_address,
  referee.address as referee_address,
  referee.user_id as referee_user_id,
  U.profile as referee_profile,
  -- when referee creates a community
  C.id as community_id,
  C.name as community_name,
  C.icon_url as community_icon_url,
  referrals.namespace_address,
  COALESCE(referrals.referrer_received_eth_amount, '0') as referrer_received_eth_amount
FROM referee 
  JOIN "Users" U ON U.id = referee.user_id
  LEFT JOIN referrals
    ON referrals.referrer_address = referee.referred_by_address
    AND referrals.referee_address = referee.address
  LEFT JOIN "Communities" C ON C.namespace_address = referrals.namespace_address
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
