import { EventHandler, Policy, command, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { models } from '../database';
import { systemActor } from '../middleware';
import { CreateLaunchpadToken } from '../token/CreateToken.command';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleLaunchpadTrade } from './handlers/handleLaunchpadTrade';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';
import { handleReferralSet } from './handlers/handleReferralSet';

const log = logger(import.meta);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  switch (payload.eventSource.eventSignature) {
    case EvmEventSignatures.CommunityStake.Trade:
      await handleCommunityStakeTrades(models, payload);
      break;

    case EvmEventSignatures.Launchpad.TokenLaunched: {
      const chainNode = await models.ChainNode.findOne({
        where: {
          eth_chain_id: payload.eventSource.ethChainId,
        },
      });
      await command(CreateLaunchpadToken(), {
        actor: systemActor({}),
        payload: {
          chain_node_id: chainNode!.id!,
          community_id: '', // not required for system actors
          transaction_hash: payload.rawLog.transactionHash,
        },
      });
      break;
    }

    case EvmEventSignatures.Launchpad.Trade:
      await handleLaunchpadTrade(payload);
      break;

    case EvmEventSignatures.Referrals.ReferralSet:
      await handleReferralSet(payload);
      break;

    case EvmEventSignatures.Referrals.FeeDistributed:
      await handleReferralFeeDistributed(payload);
      break;

    default:
      log.error('Attempted to process an unsupported chain-event', undefined, {
        event: payload,
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
