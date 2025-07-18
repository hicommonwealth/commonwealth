import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { createHmac } from 'crypto';
import { config } from '../../config';
import { authVerified } from '../../middleware';

export function GetMoonpaySignatureQuery(): Query<
  typeof schemas.GetMoonpaySignature
> {
  return {
    ...schemas.GetMoonpaySignature,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload }) => {
      if (!config.MOONPAY.SECRET_KEY) {
        throw new Error('MoonPay secret key not configured');
      }

      try {
        const url = new URL(payload.url);
        const queryString = url.search;

        if (!queryString) {
          throw new Error('Invalid URL format - no query string found');
        }

        const signature = createHmac('sha256', config.MOONPAY.SECRET_KEY)
          .update(queryString)
          .digest('base64');

        console.log('signature', signature);

        return { signature };
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Invalid URL format');
      }
    },
  };
}
