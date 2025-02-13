import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleLaunchpadTokenCreated } from './handlers/handleLaunchpadTokenCreated';
import { handleLaunchpadTrade } from './handlers/handleLaunchpadTrade';
import { handleNamespaceDeployedWithReferral } from './handlers/handleNamespaceDeployedWithReferral';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';

const chainEventInputs = {
  CommunityStakeTrade: events.CommunityStakeTrade,
  NamespaceDeployedWithReferral: events.NamespaceDeployedWithReferral,
  LaunchpadTokenCreated: events.LaunchpadTokenCreated,
  LaunchpadTrade: events.LaunchpadTrade,
  ReferralFeeDistributed: events.ReferralFeeDistributed,
};

export function ChainEventPolicy(): Policy<
  typeof chainEventInputs,
  ZodUndefined
> {
  return {
    inputs: chainEventInputs,
    body: {
      CommunityStakeTrade: handleCommunityStakeTrades,
      NamespaceDeployedWithReferral: handleNamespaceDeployedWithReferral,
      LaunchpadTokenCreated: handleLaunchpadTokenCreated,
      LaunchpadTrade: handleLaunchpadTrade,
      ReferralFeeDistributed: handleReferralFeeDistributed,
    },
  };
}
