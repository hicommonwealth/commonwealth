import { events, Policy } from '@hicommonwealth/core';
import { models } from '../database';
import { createTokenHandler } from '../token';

const inputs = {
  TokenLaunched: events.TokenLaunched,
};

export function LaunchpadPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TokenLaunched: async ({ payload }) => {
        const token = await models.Token.findOne({
          where: { token_address: payload.tokenAddress },
        });

        // token already exists in db
        if (token) {
          return;
        }

        await createTokenHandler(
          payload.eventSource.chainNodeId,
          payload.tokenAddress,
        );
      },
    },
  };
}
