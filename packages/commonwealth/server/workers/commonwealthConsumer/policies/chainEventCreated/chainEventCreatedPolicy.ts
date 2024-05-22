import { EventHandler, Policy, events, logger } from '@hicommonwealth/core';
import {
  communityStakeTradeEventSignature,
  deployedNamespaceEventSignature,
  models,
} from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handleCommunityStakeTrades';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  if (
    payload.eventSource.eventSignature === communityStakeTradeEventSignature
  ) {
    await handleCommunityStakeTrades(models, payload);
  } else if (
    payload.eventSource.eventSignature === deployedNamespaceEventSignature
  ) {
    log.info('Implementation not defined', { payload });
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
