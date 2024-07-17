import {
  EvmCommunityStakingEventSignatures,
  EvmNamespaceFactoryEventSignatures,
  EvmRecurringContestEventSignatures,
  EvmSingleContestEventSignatures,
  logger as loggerFactory,
  type Command,
} from '@hicommonwealth/core';
import { equalEvmAddresses } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { commonProtocol as cp } from '@hicommonwealth/shared';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const logger = loggerFactory(__filename);

// TODO: how do we handle chain re-orgs

function anyAddressEqual(
  addresses: string[],
  addressToCompare: string,
): boolean {
  for (const address of addresses) {
    if (equalEvmAddresses(address, addressToCompare)) return true;
  }
  return false;
}

// TODO: this function will be moved to a util for the Contest project handler (replaces EvmEventSource.create)
/**
 * This function makes an API request to Alchemy to add the specified contract address to the GraphQL query of the
 * relevant webhook. If the contract address already exists in the query filter this function does nothing.
 */
async function addContractAddressToWebhook() {}

export function ChainEventCreated(): Command<typeof schemas.ChainEventCreated> {
  return {
    ...schemas.ChainEventCreated,
    auth: [],
    secure: false,
    body: async ({ id, payload }) => {
      // The name of the chain e.g. BaseSepolia (ex webhook url: /v1/rest/chainevent/BaseSepolia/ChainEventCreated)
      let chain = id!;

      // TODO: modify event parsing functions + emit events to Outbox
      for (const log of payload.event.data.block.logs) {
        const eventSignature = log.topics[0];
        const contractAddress = log.account.address;

        // Namespace/Contest factory contract events
        if (
          anyAddressEqual(
            [
              cp.factoryContracts[cp.ValidChains.Base].factory,
              cp.factoryContracts[cp.ValidChains.SepoliaBase].factory,
              cp.factoryContracts[cp.ValidChains.Sepolia].factory,
            ],
            contractAddress,
          )
        ) {
          switch (eventSignature) {
            case EvmNamespaceFactoryEventSignatures.NewContest:
              logger.info('New Contest Deployed');
              break;
            case EvmNamespaceFactoryEventSignatures.NewNamespace:
              logger.info('New Namespace Deployed');
              break;
          }
        }

        // CommunityStake contract events
        if (
          eventSignature === EvmCommunityStakingEventSignatures.trade &&
          anyAddressEqual(
            [
              cp.factoryContracts[cp.ValidChains.Base].communityStake,
              cp.factoryContracts[cp.ValidChains.SepoliaBase].communityStake,
              cp.factoryContracts[cp.ValidChains.Sepolia].communityStake,
            ],
            contractAddress,
          )
        ) {
          logger.info('Community Stake Trade');
        }

        // Contest contract events
        // TODO: Fetch contest contracts from DB (managers table or EvmEventSources?)
        const contestContracts: string[] = [];
        if (anyAddressEqual(contestContracts, contractAddress)) {
          switch (eventSignature) {
            case EvmRecurringContestEventSignatures.ContestStarted:
              break;
            case EvmSingleContestEventSignatures.ContestStarted:
              break;
            case EvmRecurringContestEventSignatures.ContentAdded:
            case EvmSingleContestEventSignatures.ContentAdded:
              break;
            case EvmRecurringContestEventSignatures.VoterVoted:
              break;
            case EvmSingleContestEventSignatures.VoterVoted:
              break;
          }
        }
      }

      return {};
    },
  };
}
