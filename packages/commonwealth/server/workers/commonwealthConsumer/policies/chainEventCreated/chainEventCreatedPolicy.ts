import { EventHandler, Policy, schemas } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handleCommunityStakeTrades';
import { handleGovernanceProposalEvents } from './handleGovnernanceProposalEvents';

const log = logger(__filename);

const deployedNamespaceEventSignature =
  '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5';
const communityStakeTradeEventSignature =
  '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e';
const proposalEventSignatures = [
  '0x11a0b38e70585e4b09b794bd1d9f9b1a51a802eb8ee2101eeee178d0349e73fe',
  '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f',
  '0x789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c',
  '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0',
  '0x9a2e42fd6722813d69113e7d0079d3d940171428df7373df9c7f7617cfda2892',
  '0x9c85b616f29fca57a17eafe71cf9ff82ffef41766e2cf01ea7f8f7878dd3ec24',
  '0xd272d67d2c8c66de43c1d2515abb064978a5020c173e15903b6a2ab3bf7440ec',
];

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  const { models } = await import('@hicommonwealth/model');

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

const chainEventInputs = {
  ChainEventCreated: schemas.events.ChainEventCreated,
};

export const ChainEventPolicy: Policy<
  typeof chainEventInputs,
  ZodUndefined
> = () => ({
  inputs: chainEventInputs,
  body: {
    ChainEventCreated: processChainEventCreated,
  },
});
