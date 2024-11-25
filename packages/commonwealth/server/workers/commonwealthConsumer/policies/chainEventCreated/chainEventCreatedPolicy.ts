import {
  Actor,
  EventHandler,
  Policy,
  command,
  events,
  logger,
} from '@hicommonwealth/core';
import {
  Token,
  communityStakeTradeEventSignature,
  deployedNamespaceEventSignature,
  launchpadTokenLaunchedEventSignature,
  launchpadTradeEventSignature,
  models,
} from '@hicommonwealth/model';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handleCommunityStakeTrades';
import { handleLaunchpadTrade } from './handleLaunchpadTrade';

const log = logger(import.meta);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  if (
    payload.eventSource.eventSignature === communityStakeTradeEventSignature
  ) {
    await handleCommunityStakeTrades(models, payload);
  } else if (
    payload.eventSource.eventSignature === launchpadTokenLaunchedEventSignature
  ) {
    await command(Token.CreateToken(), {
      actor: [] as unknown as Actor,
      payload: {
        chain_node_id: payload.eventSource.chainNodeId,
        transaction_hash: payload.rawLog.transactionHash,
      },
    });
  } else if (
    payload.eventSource.eventSignature === deployedNamespaceEventSignature
  ) {
    log.info('Implementation not defined', { payload });
  } else if (
    payload.eventSource.eventSignature === launchpadTradeEventSignature
  ) {
    await handleLaunchpadTrade(payload);
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
