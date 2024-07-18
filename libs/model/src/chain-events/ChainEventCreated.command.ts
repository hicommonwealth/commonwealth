import {
  EvmCommunityStakingEventSignatures,
  EvmNamespaceFactoryEventSignatures,
  EvmRecurringContestEventSignatures,
  EvmSingleContestEventSignatures,
  logger as loggerFactory,
  type Command,
} from '@hicommonwealth/core';
import { config, equalEvmAddresses } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { commonProtocol as cp } from '@hicommonwealth/shared';
import { Hmac, createHmac } from 'crypto';
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

export function verifyAlchemySignature(req: any) {
  const signature = req.headers['x-alchemy-signature'];
  let hmac: Hmac | undefined;
  if (req.url.includes('BaseSepolia')) {
    hmac = createHmac(
      'sha256',
      config.ALCHEMY.BASE_SEPOLIA_WEBHOOK_SIGNING_KEY!,
    );
  } else if (req.url.includes('Base')) {
    hmac = createHmac('sha256', config.ALCHEMY.BASE_WEBHOOK_SIGNING_KEY!);
  } else if (req.url.includes('EthSepolia')) {
    hmac = createHmac(
      'sha256',
      config.ALCHEMY.ETH_SEPOLIA_WEBHOOOK_SIGNING_KEY!,
    );
  }

  if (!hmac) throw new Error('Unauthorized');

  hmac.update(req.body.toString(), 'utf-8');
  const digest = hmac.digest('hex');
  if (signature !== digest) throw new Error('Invalid signature');
}

// TODO: this function will be moved to a util for the Contest project handler (replaces EvmEventSource.create)
/**
 * This function makes an API request to Alchemy to add the specified contract address to the GraphQL query of the
 * relevant webhook. If the contract address already exists in the query filter this function does nothing.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function addContractAddressToWebhook() {}

export function ChainEventCreated(): Command<typeof schemas.ChainEventCreated> {
  return {
    ...schemas.ChainEventCreated,
    auth: [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    body: async ({ id, payload }) => {
      // The name of the chain e.g. BaseSepolia (ex webhook url: /v1/rest/chainevent/ChainEventCreated/BaseSepolia)
      // let chain = id!;

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
