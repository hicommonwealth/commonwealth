import { EventHandler, logger } from '@hicommonwealth/core';
import {
  communityStakeTradeEventSignature,
  deployedNamespaceEventSignature,
  models,
  proposalEventSignatures,
} from '@hicommonwealth/model';
import z from 'zod';
import { handleCommunityStakeTrades } from './chainEvents/handleCommunityStakeTrades';
import { handleGovernanceProposalEvents } from './chainEvents/handleGovnernanceProposalEvents';

const log = logger(import.meta);

const output = z.boolean();

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  typeof output
> = async ({ payload }) => {
  if (
    payload.eventSource.eventSignature === communityStakeTradeEventSignature
  ) {
    return await handleCommunityStakeTrades(models, payload);
  } else if (
    payload.eventSource.eventSignature === deployedNamespaceEventSignature
  ) {
    log.info('Implementation not defined', { payload });
    return false;
  } else if (
    proposalEventSignatures.includes(payload.eventSource.eventSignature)
  ) {
    return await handleGovernanceProposalEvents(models, payload);
  } else {
    log.error('Attempted to process an unsupported chain-event', undefined, {
      event: payload,
    });
    return false;
  }
};
