import { PinoLogger } from '@hicommonwealth/adapters';
import {
  EventHandler,
  Policy,
  commonProtocol,
  logger,
  schemas,
} from '@hicommonwealth/core';
import Web3 from 'web3';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handleCommunityStakeTrades';
import { handleGovernanceProposalEvents } from './handleGovnernanceProposalEvents';

const log = logger(PinoLogger()).getLogger(__filename);

const genericWeb3 = new Web3();

const communityStakeContractAddresses = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.communityStake);
const namespaceFactoryContractAddresses = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.factory);

export const processChainEventCreated: EventHandler<
  'ChainEventCreated',
  ZodUndefined
> = async ({ payload }) => {
  const { models } = await import('@hicommonwealth/model');

  const contractAddress = genericWeb3.utils.toChecksumAddress(
    payload.rawLog.address,
  );
  if (communityStakeContractAddresses.includes(contractAddress)) {
    await handleCommunityStakeTrades(models, payload);
  } else if (namespaceFactoryContractAddresses.includes(contractAddress)) {
    log.info('Implementation not defined', undefined, { payload });
  } else if (payload.eventSource.kind.includes('proposal')) {
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
