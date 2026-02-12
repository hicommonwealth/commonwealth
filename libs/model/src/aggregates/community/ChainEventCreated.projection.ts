import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { projectCommunityStakeTrades } from './projections/projectCommunityStakeTrades';
import { projectReferralFeeDistributed } from './projections/projectReferralFeeDistributed';

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
      CommunityStakeTrade: projectCommunityStakeTrades,
      ReferralFeeDistributed: projectReferralFeeDistributed,
    },
  };
}
