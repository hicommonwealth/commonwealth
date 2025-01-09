import { EventHandler, Policy, command, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { models } from '../database';
import { systemActor } from '../middleware';
import { CreateLaunchpadToken } from '../token/CreateToken.command';
import { handleCommunityStakeTrades } from './handleCommunityStakeTrades';
import { handleLaunchpadTrade } from './handleLaunchpadTrade';
import { handleReferralFeeDistributed } from './handleReferralFeeDistributed';
import { handleReferralSet } from './handleReferralSet';

const log = logger(import.meta);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.CommunityStake.Trade
  ) {
    await handleCommunityStakeTrades(models, payload);
  } else if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.Launchpad.TokenLaunched
  ) {
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
  } else if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.NamespaceFactory.NamespaceDeployed
  ) {
    log.info('Implementation not defined', { payload });
  } else if (
    payload.eventSource.eventSignature === EvmEventSignatures.Launchpad.Trade
  ) {
    await handleLaunchpadTrade(payload);
  } else if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.Referrals.ReferralSet
  ) {
    await handleReferralSet(payload);
  } else if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.Referrals.FeeDistributed
  ) {
    await handleReferralFeeDistributed(payload);
  } else {
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
