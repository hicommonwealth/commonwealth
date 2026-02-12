import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';

const inputs = {
  CommunityStakeTrade: events.CommunityStakeTrade,
  ReferralFeeDistributed: events.ReferralFeeDistributed,
};

export function ChainEventProjection(): Projection<
  typeof inputs,
  ZodUndefined
> {
  return {
    inputs,
    body: {
      CommunityStakeTrade: handleCommunityStakeTrades,
      ReferralFeeDistributed: handleReferralFeeDistributed,
    },
  };
}
