import _ from 'underscore';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import type Rollbar from 'rollbar';

import type { SubstrateEvents } from '../../src';
import {
  createListener,
  ErcLoggingHandler,
  getChainEventNetwork,
  LoggingHandler,
  SupportedNetwork,
} from '../../src';
import { SubstrateTypes } from '../../src/types';
import type { DB } from '../database/database';
import models from '../database/database';

import type { ChainAttributes, IListenerInstances } from './types';
import { IRabbitMqHandler } from '../ChainEventsConsumer/ChainEventHandlers';

const log = factory.getLogger(formatFilename(__filename));

const generalLogger = new LoggingHandler();

export function getErcListenerName(chain: ChainAttributes): string {
  return `${chain.ChainNode.name}::${chain.network}`;
}

export async function manageErcListeners(
  groupedTokens: { [origin: string]: ChainAttributes[] },
  listenerInstances: IListenerInstances,
  producer: IRabbitMqHandler,
  rollbar?: Rollbar
): Promise<void> {
  // delete any listeners that have no more tokens to listen to
  for (const listenerName of Object.keys(listenerInstances)) {
    if (
      listenerName.includes(SupportedNetwork.ERC20) ||
      listenerName.includes(SupportedNetwork.ERC721)
    ) {
      if (!groupedTokens[listenerName]) {
        log.info(`Deleting listener: ${listenerName}`);
        await listenerInstances[listenerName].unsubscribe();
        delete listenerInstances[listenerName];
      }
    }
  }

  // update erc listeners
  for (const [listenerName, tokens] of Object.entries(groupedTokens)) {
    // skip if listener doesn't exist
    if (!listenerInstances[listenerName]) continue;
    log.info(`Updating listener: ${listenerName}`);

    const newTokenAddresses = tokens.map((chain) => chain.contract_address);
    const existingListener = listenerInstances[listenerName];

    if (
      newTokenAddresses.length !=
        existingListener.options.tokenAddresses.length ||
      !_.isEqual(newTokenAddresses, existingListener.options.tokenAddresses)
    ) {
      // if the tokens for a listener have changed unsub and delete the listener, so it is recreated
      log.info(
        `Updating listener ${listenerName} to contracts: ${newTokenAddresses.join(
          ', '
        )}`
      );
      await existingListener.unsubscribe();
      delete listenerInstances[listenerName];
    } else {
      const loggingHandler = existingListener.eventHandlers.logging
        ?.handler as ErcLoggingHandler;
      // if the tokens list is the same update the logging handler tokenAddresses
      loggingHandler.tokenAddresses = tokens
        .filter((token) => token.verbose_logging)
        .map((token) => token.contract_address);
    }
  }

  // create erc listeners
  for (const [listenerName, tokens] of Object.entries(groupedTokens)) {
    // skip if listener already exists
    if (listenerInstances[listenerName]) continue;
    log.info(`Creating listener: ${listenerName}`);

    // these assumptions are safe because we are grouping by ChainNode.name thus all tokens under
    // a specific listenerName will have the same url and chainName
    const network = tokens[0].network;
    const url = tokens[0].ChainNode.url;
    const chainName = tokens[0].ChainNode.name;
    const tokenAddresses = tokens.map((chain) => chain.contract_address);
    try {
      listenerInstances[listenerName] = await createListener(
        listenerName,
        chainName,
        network as unknown as SupportedNetwork,
        {
          tokenAddresses,
          url,
        }
      );
    } catch (e) {
      log.error(
        `An error occurred while starting listener ${listenerName} for ${JSON.stringify(
          tokenAddresses
        )} connecting to ${url}`,
        e
      );
      rollbar?.critical(
        `An error occurred while starting listener ${listenerName} for ${JSON.stringify(
          tokenAddresses
        )} connecting to ${url}`,
        e
      );
    }

    log.info(`Adding RabbitMQ event handler to listener: ${listenerName}`);
    listenerInstances[listenerName].eventHandlers.rabbitmq = {
      handler: producer,
      excludedEvents: [],
    };

    // array of token addresses that require verbose logging
    const verboseTokenAddresses = tokens
      .filter((token) => token.verbose_logging)
      .map((token) => token.contract_address);

    // if there are any tokens that require verbose logging, add the logging handler to the listener
    if (verboseTokenAddresses.length > 0) {
      log.info(`Adding verbose logging to listener: ${listenerName}`);
      const logger = new ErcLoggingHandler(network, verboseTokenAddresses);

      listenerInstances[listenerName].eventHandlers.logging = {
        handler: logger,
        excludedEvents: [],
      };
    }

    log.info(
      `Subscribing listener ${listenerName} to contracts: ${tokenAddresses.join(
        ', '
      )}`
    );
    await listenerInstances[listenerName].subscribe();
  }
}

/**
 * This function creates, updates, and deletes all listeners except ERC20 and
 * ERC721 listeners.
 * @param chains A list of new chains to create listener instances for
 * @param listenerInstances An object containing all the currently active listener instances
 * @param producer An instance of RabbitMqHandler which is one of the event handlers
 * @param rollbar An instance of rollbar for error reporting
 */
export async function manageRegularListeners(
  chains: ChainAttributes[],
  listenerInstances: IListenerInstances,
  producer: IRabbitMqHandler,
  rollbar?: Rollbar
): Promise<void> {
  // for ease of use create a new object containing all listener instances that are not ERC20 or ERC721
  const regListenerInstances: IListenerInstances = {};
  const activeListenerNames: string[] = [];
  for (const [origin, instance] of Object.entries(listenerInstances)) {
    if (
      !origin.includes(ChainNetwork.ERC20) &&
      !origin.includes(ChainNetwork.ERC721)
    )
      regListenerInstances[origin] = instance;
    activeListenerNames.push(origin);
  }

  // delete any listeners that should no longer be active on this ChainSubscriber instance
  const updatedChainOrigins = chains.map((chain) => chain.origin);
  Object.keys(regListenerInstances).forEach((origin) => {
    if (!updatedChainOrigins.includes(origin)) {
      log.info(`[${origin}]: Deleting chain listener...`);
      listenerInstances[origin].unsubscribe();
      delete listenerInstances[origin];
    }
  });

  const newChains = chains.filter((chain) => {
    return !activeListenerNames.includes(chain.origin);
  });

  // create listeners for all the new chains -- this does not update any existing chains!
  await setupNewListeners(newChains, listenerInstances, producer, rollbar);

  // update existing listeners whose verbose_logging or substrate_spec has changed
  await updateExistingListeners(chains, listenerInstances, rollbar);

  // fetch and publish on-chain substrate identities
  // await fetchSubstrateIdentities(chains, listenerInstances, pool, producer, rollbar);
}

/**
 * Provided a list of the new chains that do not have existing listener instances,
 * this function will create a listener instance and setup all the relevant
 * event handlers.
 * @param newChains A list of new chains to create listener instances for
 * @param listenerInstances An object containing all the currently active listener instances
 * @param producer An instance of RabbitMqHandler which is one of the event handlers
 * @param rollbar An instance of rollbar for error reporting
 */
async function setupNewListeners(
  newChains: ChainAttributes[],
  listenerInstances: IListenerInstances,
  producer: IRabbitMqHandler,
  rollbar?: Rollbar
) {
  for (const chain of newChains) {
    let network: SupportedNetwork;
    try {
      network = getChainEventNetwork(chain.network, chain.base);
    } catch (e) {
      log.error(
        `Unknown chain base: ${chain.base} \tand network: ${chain.network}`,
        e
      );
      continue;
    }
    try {
      log.info(`Starting listener for: ${chain.origin}`);
      listenerInstances[chain.origin] = await createListener(
        chain.origin,
        chain.ChainNode.name,
        network,
        {
          address: chain.contract_address,
          archival: false,
          url: chain.ChainNode.url,
          skipCatchup: false,
          verbose: false, // using this will print event before chain is added to it
          enricherConfig: { balanceTransferThresholdPermill: 10_000 },
          discoverReconnectRange: discoverReconnectRange.bind(models),
        }
      );
    } catch (error) {
      delete listenerInstances[chain.origin];
      log.error(
        `Unable to create a listener instance for ${chain.origin}`,
        error
      );
      rollbar?.critical(
        `Unable to create a listener instance for ${chain.origin}`,
        error
      );
      continue;
    }

    // if a substrate chain then ignore some events
    let excludedEvents = [];
    if (network === SupportedNetwork.Substrate)
      excludedEvents = [
        SubstrateTypes.EventKind.Reward,
        SubstrateTypes.EventKind.TreasuryRewardMinting,
        SubstrateTypes.EventKind.TreasuryRewardMintingV2,
        SubstrateTypes.EventKind.HeartbeatReceived,
        'treasury-bounty-proposed',
        'treasury-bounty-awarded',
        'treasury-bounty-rejected',
        'treasury-bounty-became-active',
        'treasury-bounty-claimed',
        'treasury-bounty-canceled',
        'treasury-bounty-extended',
        'collective-proposed',
        'collective-voted',
        'collective-approved',
        'collective-disapproved',
        'collective-executed',
        'collective-member-executed',
        'identity-judgement-given',
      ];

    // add the rabbitmq handler and the events it should ignore
    listenerInstances[chain.origin].eventHandlers.rabbitmq = {
      handler: producer,
      excludedEvents,
    };

    // add the logger and the events it should ignore if required
    if (chain.verbose_logging) {
      listenerInstances[chain.origin].eventHandlers.logger = {
        handler: generalLogger,
        excludedEvents,
      };
    }

    try {
      // subscribe the listener to its chain/RPC if it isn't yet subscribed
      log.info(`Subscribing listener: ${chain.origin}`);
      await listenerInstances[chain.origin].subscribe();
    } catch (e) {
      delete listenerInstances[chain.origin];
      log.error(`Failed to subscribe listener: ${chain.origin}`, e);
    }
  }
}

/**
 * Provided a list of all the chains, this function determines if any listeners
 * need to be updated. Values that could have changed in a chain instance
 * include verbose_logging and substrate_spec.
 * @param allChains An array containing all the chains pulled from the database
 * @param listenerInstances An object containing all the currently active listener instances
 * @param rollbar An instance of rollbar for error reporting
 */
async function updateExistingListeners(
  allChains: ChainAttributes[],
  listenerInstances: IListenerInstances,
  rollbar?: Rollbar
) {
  for (const chain of allChains) {
    // skip a chain if the listener is inactive due to an error occurring for that specific listener i.e. connection error
    if (!listenerInstances[chain.origin]) continue;
    // if the chain is a substrate chain and its spec has changed since the last
    // check then update the active listener with the new spec
    if (
      listenerInstances[chain.origin].eventHandlers.logger &&
      !chain.verbose_logging
    ) {
      delete listenerInstances[chain.origin].eventHandlers.logger;
    }
  }
}

export function getListenerNames(
  listenerInstances: IListenerInstances
): string[] {
  const activeListenerInstances = [];
  for (const listenerName of Object.keys(listenerInstances)) {
    if (
      !listenerName.startsWith(ChainNetwork.ERC20) &&
      !listenerName.startsWith(ChainNetwork.ERC721)
    )
      activeListenerInstances.push(listenerName);
    else {
      activeListenerInstances.push(
        listenerInstances[listenerName].options.tokenNames
      );
    }
  }

  return activeListenerInstances;
}

/**
 * This function queries the chain-events database for the most recent
 * chain-event and attempts to retrieve all on-chain events since that
 * chain-event.
 * WARNING: This function requires to be binded with a PG pool instance
 * e.g. discoverReconnectRange.bind({ pool })
 * @param chainName
 * @param contractAddress
 */
async function discoverReconnectRange(
  this: DB,
  chainName: string,
  contractAddress: string = null
) {
  let prefix;
  if (contractAddress) prefix = chainName + '::' + contractAddress + '::';
  else prefix = chainName;

  let latestBlock;
  try {
    latestBlock = await this.ChainEvent.max('block_number', {
      where: { chain_name: chainName, contract_address: contractAddress },
    });

    if (latestBlock) {
      log.info(
        `[${prefix}]: Discovered chain event in db at block ${latestBlock}.`
      );
      return { startBlock: latestBlock + 1 };
    }
    log.info(`[${prefix}]: No chain-events found in the database`);
    return { startBlock: null };
  } catch (error) {
    log.warn(
      `[${prefix}]: An error occurred while discovering offline time range`,
      error
    );
  }

  return { startBlock: null };
}
