import { EventHandler } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import {
  communityStakeTradeEventSignature,
  deployedNamespaceEventSignature,
  models,
  proposalEventSignatures,
} from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './chainEvents/handleCommunityStakeTrades';
import { handleGovernanceProposalEvents } from './chainEvents/handleGovnernanceProposalEvents';

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
  } else if (
    proposalEventSignatures.includes(payload.eventSource.eventSignature)
  ) {
    await handleGovernanceProposalEvents(models, payload);
  } else {
    log.error('Attempted to process an unsupported chain-event', undefined, {
      event: payload,
    });
  }
};
