import { EventHandler, logger } from '@hicommonwealth/core';
import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import z from 'zod';
import { handleCommunityStakeTrades } from './chainEvents/handleCommunityStakeTrades';

const log = logger(import.meta);

const output = z.boolean();

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  typeof output
> = async ({ payload }) => {
  if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.CommunityStake.Trade
  ) {
    return await handleCommunityStakeTrades(models, payload);
  } else if (
    payload.eventSource.eventSignature ===
    EvmEventSignatures.NamespaceFactory.NamespaceDeployed
  ) {
    log.info('Implementation not defined', { payload });
    return false;
  } else {
    log.error('Attempted to process an unsupported chain-event', undefined, {
      event: payload,
    });
    return false;
  }
};
