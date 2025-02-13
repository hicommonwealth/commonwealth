import { EventHandler, Policy, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleNamespaceDeployedWithReferral } from './handlers/handleNamespaceDeployedWithReferral';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';

const log = logger(import.meta);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  switch (payload.eventSource.eventSignature) {
    case EvmEventSignatures.NamespaceFactory.NamespaceDeployedWithReferral:
      await handleNamespaceDeployedWithReferral(payload);
      break;

    case EvmEventSignatures.CommunityStake.Trade:
      await handleCommunityStakeTrades(payload);
      break;

    case EvmEventSignatures.Referrals.ReferralSet:
      // await handleReferralSet(payload);
      break;

    case EvmEventSignatures.Referrals.FeeDistributed:
      await handleReferralFeeDistributed(payload);
      break;

    default:
      log.warn('Unsupported chain-event', {
        event: payload.eventSource.eventSignature,
      });
  }
};

const chainEventInputs = {
  ChainEventCreated: events.ChainEventCreated,
};

export function ChainEventPolicy(): Policy<
  typeof chainEventInputs,
  ZodUndefined
> {
  return {
    inputs: chainEventInputs,
    body: {
      ChainEventCreated: processChainEventCreated,
    },
  };
}
