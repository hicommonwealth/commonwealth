import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleNamespaceDeployed } from './handlers/handleNamespaceDeployed';
import { handleNamespaceDeployedWithReferral } from './handlers/handleNamespaceDeployedWithReferral';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';

const chainEventInputs = {
  CommunityStakeTrade: events.CommunityStakeTrade,
  NamespaceDeployed: events.NamespaceDeployed,
  NamespaceDeployedWithReferral: events.NamespaceDeployedWithReferral,
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
      NamespaceDeployed: handleNamespaceDeployed,
      NamespaceDeployedWithReferral: handleNamespaceDeployedWithReferral,
      ReferralFeeDistributed: handleReferralFeeDistributed,
    },
  };
}
