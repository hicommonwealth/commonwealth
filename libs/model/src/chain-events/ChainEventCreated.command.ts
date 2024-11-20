import { parseEvmEvent, type Command } from '@hicommonwealth/core';
import {
  EvmEventSignature,
  EvmEventSignatures,
  commonProtocol as cp,
} from '@hicommonwealth/evm-protocols';
import {
  config,
  emitEvent,
  equalEvmAddresses,
  models,
} from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { Hmac, createHmac } from 'crypto';

// TODO: how do we handle chain re-orgs
//  Alchemy re-emits logs with `removed: true` -> modify event handlers to rollback changes if `removed: true`.
//  Encapsulate re-org logic in consumer in interface since QuickNode streams (Alchemy alternative) may not follow the
//  same 'removed' pattern

function anyAddressEqual(
  addresses: string[],
  addressToCompare: string,
): boolean {
  for (const address of addresses) {
    if (equalEvmAddresses(address, addressToCompare)) return true;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

type AtLeastOne<ObjectT> = {
  [Key in keyof ObjectT]: Pick<ObjectT, Key>;
}[keyof ObjectT] &
  Partial<ObjectT>;

// TODO: this function will be moved to a util for the Contest project handler (replaces EvmEventSource.create)
export type AddEventSource = ({
  contractEvents,
  eventSignatures,
  contractAddresses,
}: AtLeastOne<{
  contractEvents?: { [contractAddress: string]: Array<string> };
  eventSignatures?: Array<string>;
  contractAddresses?: Array<string>;
}>) => Promise<void>;

/**
 * This function makes an API request to Alchemy to add the specified contract address to the GraphQL query of the
 * relevant webhook. If the contract address already exists in the query filter this function does nothing.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const addAlchemyWebhookFilter: AddEventSource = async () => {};

/**
 * This command works under the assumption that only Common is adding contest data on-chain. This is because in order
 * to order events, the command expects a contest manager to exist in the database before a ContentAdded event is
 * emitted. This is currently the case because users cannot add content or upvote in a contest until the contest manager
 * exists in the DB, and we don't support external content on-chain.
 * @constructor
 */
export function ChainEventCreated(): Command<typeof schemas.ChainEventCreated> {
  return {
    ...schemas.ChainEventCreated,
    auth: [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
    body: async ({ payload }) => {
      // The name of the chain e.g. BaseSepolia (ex webhook url: /v1/rest/chainevent/ChainEventCreated/BaseSepolia)
      // let chain = id!;

      const events = [];
      for (const log of payload.event.data.block.logs) {
        const eventSignature = log.topics[0];
        const contractAddress = log.account.address;

        // NamespaceFactory and CommunityStake
        if (
          anyAddressEqual(
            [
              // Namespace/Contest factory contract events
              cp.factoryContracts[cp.ValidChains.Base].factory,
              cp.factoryContracts[cp.ValidChains.SepoliaBase].factory,
              cp.factoryContracts[cp.ValidChains.Sepolia].factory,

              // CommunityStake contract events
              cp.factoryContracts[cp.ValidChains.Base].communityStake,
              cp.factoryContracts[cp.ValidChains.SepoliaBase].communityStake,
              cp.factoryContracts[cp.ValidChains.Sepolia].communityStake,
            ],
            contractAddress,
          )
        ) {
          events.push(
            parseEvmEvent(
              contractAddress,
              eventSignature as EvmEventSignature,
              log.data,
              log.topics,
            ),
          );
        } else if (
          // Contests
          Object.values(EvmEventSignatures.Contests).includes(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eventSignature as any,
          )
        ) {
          const matchingContestContract = await models.ContestManager.findByPk(
            contractAddress,
            {
              attributes: ['contest_address'],
            },
          );

          if (matchingContestContract) {
            events.push(
              parseEvmEvent(
                contractAddress,
                eventSignature as EvmEventSignature,
                log.data,
                log.topics,
              ),
            );
          }
        }
      }

      if (events.length > 0) {
        await emitEvent(models.Outbox, events);
      }
    },
  };
}
