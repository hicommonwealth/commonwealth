import { EventHandler, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import z from 'zod';
import { models } from '../../database';
import { notifyCommunityStakeTrades } from './notifyCommunityStakeTrades';

const log = logger(import.meta);

const output = z.boolean();

export const notifyChainEventCreated: EventHandler<
  'ChainEventCreated',
  typeof output
> = async ({ payload }) => {
  switch (payload.eventSource.eventSignature) {
    case EvmEventSignatures.CommunityStake.Trade:
      await notifyCommunityStakeTrades(models, payload);
      break;

    default:
      log.warn('Unsupported chain-event notification', {
        event: payload.eventSource.eventSignature,
      });
  }
};
