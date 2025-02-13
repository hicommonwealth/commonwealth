import { EventHandler, Policy, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleLaunchpadTokenCreated } from './handlers/handleLaunchpadTokenCreated';
import { handleLaunchpadTrade } from './handlers/handleLaunchpadTrade';
import { handleNamespaceDeployedWithReferral } from './handlers/handleNamespaceDeployedWithReferral';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';

const log = logger(import.meta);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  switch (payload.eventSource.eventSignature) {
    case EvmEventSignatures.Launchpad.TokenLaunched: {
      break;
    }

    case EvmEventSignatures.Launchpad.Trade:
      await handleLaunchpadTrade(payload);
      break;

    case EvmEventSignatures.Referrals.FeeDistributed:
      await handleReferralFeeDistributed(payload);
      break;
  }
};

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
