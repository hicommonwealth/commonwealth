import { events, Policy } from '@hicommonwealth/core';
import { createTokenHandler } from '../token';

const inputs = {
  TokenLaunched: events.TokenLaunched,
};

export function LaunchpadPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TokenLaunched: async ({ payload }) => {
        await createTokenHandler(
          payload.eventSource.chainNodeId,
          payload.tokenAddress,
        );
      },
    },
  };
}
