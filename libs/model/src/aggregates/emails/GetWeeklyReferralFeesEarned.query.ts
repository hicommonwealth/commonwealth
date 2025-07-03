import {
  ExternalServiceUserIds,
  GetWeeklyReferralFeesEarned,
  Query,
} from '@hicommonwealth/core';
import { QueryTypes } from 'sequelize';
import { models } from '../../database';
import { generateUnsubscribeLink } from '../../utils';

export function GetWeeklyReferralFeesEarnedQuery(): Query<
  typeof GetWeeklyReferralFeesEarned
> {
  return {
    ...GetWeeklyReferralFeesEarned,
    auth: [],
    secure: true,
    authStrategy: { type: 'authtoken', userId: ExternalServiceUserIds.Knock },
    body: async ({ payload }) => {
      const fees = await models.sequelize.query<{
        transaction_date: string;
        referrer_address: string;
        referee_address: string;
        received_amount: string;
      }>(
        `
        SELECT DISTINCT 
          TO_TIMESTAMP(F.transaction_timestamp) AT TIME ZONE 'UTC' AS transaction_date,
          F.referrer_recipient_address AS referrer_address,
          F.referee_address,
          F.referrer_received_amount::TEXT AS received_amount
        FROM
          "ReferralFees" F
          JOIN "Addresses" A ON A.address = F.referrer_recipient_address
        WHERE
          A.user_id = :user_id
          AND F.referrer_received_amount > 0
          AND TO_TIMESTAMP(F.transaction_timestamp) >= NOW() - INTERVAL '1 week'
        ORDER BY 1;
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: {
            user_id: payload.user_id,
          },
        },
      );
      const unSubscribeLink = await generateUnsubscribeLink(payload.user_id);
      return {
        fees,
        unsubscribe_link: unSubscribeLink,
      };
    },
  };
}
