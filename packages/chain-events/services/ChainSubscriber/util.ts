import _ from "underscore";
import {
  createListener,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
  Listener,
  SupportedNetwork
} from "../../src";
import { ChainBase, ChainNetwork } from "common-common/src/types";
import {
  EventKind as ERC20EventKind,
  IErc20Contracts
} from "../../src/chains/erc20/types";
import {
  EventKind as ERC721EventKind,
  IErc721Contracts
} from "../../src/chains/erc721/types";
import { Pool } from "pg";
import format from "pg-format";
import { IListenerInstances } from "./types";

export type ErcContracts = IErc20Contracts | IErc721Contracts;
export type ErcListenerInstances = Listener<ErcContracts,
  IStorageFetcher<ErcContracts>,
  IEventProcessor<ErcContracts, any>,
  IEventSubscriber<ErcContracts, any>,
  ERC20EventKind | ERC721EventKind>[]

// TODO: add the model type for groupedTokens where the grouped tokens is of the type result from allListeners query in chainSubscriber.ts
export async function manageErcListeners(
  network: ChainNetwork,
  groupedTokens: {[url: string]: any[]},
  listenerInstances: ErcListenerInstances
) {
  for (const [url, tokens] of Object.entries(groupedTokens)) {
    const tokenKey = `${network}_${url}`;
    const ercTokenAddresses = tokens.map((chain) => chain.address);
    const ercTokenNames = tokens.map((chain) => chain.id);

    let supportedNetwork: SupportedNetwork;
    switch (network) {
      case ChainNetwork.ERC20:
        supportedNetwork = SupportedNetwork.ERC20;
        break;
      case ChainNetwork.ERC721:
        supportedNetwork = SupportedNetwork.ERC721;
        break;
      default:
        break;
    }

    // update the names of the tokens whose events should be logged by the ercLoggers
    logger.tokenNames = tokens
      .filter((chain) => chain.ce_verbose)
      .map((chain) => chain.id);

    // don't start a new erc20 listener if it is causing errors
    if (!chainErrors[tokenKey] || chainErrors[tokenKey] < 4) {
      // start a listener if: it doesn't exist yet OR it exists but the tokens have changed
      if (
        tokens.length > 0 &&
        (!listenerInstances[tokenKey] ||
          (listenerInstances[tokenKey] &&
            !_.isEqual(
              ercTokenAddresses,
              listenerInstances[tokenKey].options.tokenAddresses
            )))
      ) {
        // clear the listener if it already exists and the tokens have changed
        if (listenerInstances[tokenKey]) {
          listenerInstances[tokenKey].unsubscribe();
          delete listenerInstances[tokenKey];
        }

        // start a listener
        log.info(`Starting listener for ${ercTokenNames}...`);
        try {
          listenerInstances[tokenKey] = await createListener(
            network,
            supportedNetwork,
            {
              url,
              tokenAddresses: ercTokenAddresses,
              tokenNames: ercTokenNames,
              verbose: false
            }
          );

          // add the rabbitmq handler for this chain
          listenerInstances[tokenKey].eventHandlers["rabbitmq"] = {
            handler: producer
          };
          listenerInstances[tokenKey].eventHandlers["logger"] = {
            handler: logger
          };
        } catch (error) {
          delete listenerInstances[tokenKey];
          await handleFatalError(error, pool, tokenKey, "listener-startup");
        }

        // if listener has started at this point then subscribe
        if (listenerInstances[tokenKey]) {
          try {
            // subscribe to the chain to begin listening for events
            await listenerInstances[tokenKey].subscribe();
          } catch (error) {
            await handleFatalError(error, pool, tokenKey, "listener-subscribe");
          }
        }
      } else if (listenerInstances[tokenKey] && tokens.length === 0) {
        // delete the listener if there are no tokens to listen to
        log.info(`[${tokenKey}]: Deleting ${network} listener...`);
        listenerInstances[tokenKey].unsubscribe();
        delete listenerInstances[tokenKey];
      }
    } else {
      log.fatal(
        `[${tokenKey}]: There are outstanding errors that need to be resolved
            before creating a new ${network} listener!`
      );
    }
  }
}

// TODO: add the model type for allListeners
export async function manageRegularListeners(allDbListeners: any[], listenerInstances: IListenerInstances) {
  // for ease of use create a new object containing all listener instances that are not ERC20 or ERC721
  const regListenerInstances: IListenerInstances = {}
  const activeListenerNames: string[] = [];
  for (const [name, instance] of Object.entries(listenerInstances)) {
    if (!name.startsWith(ChainNetwork.ERC20) && !name.startsWith(ChainNetwork.ERC721))
      regListenerInstances[name] = instance;
    activeListenerNames.push(name);
  }
  // delete any listeners that should no longer be active on this ChainSubscriber instance
  // this will not delete any
  const currentListenerNames = allDbListeners.map(listener => listener.chain_id);
  Object.keys(regListenerInstances).forEach((name) => {
    if (!currentListenerNames.includes(name)) {
      log.info(`[${name}]: Deleting chain listener...`);
      listenerInstances[name].unsubscribe();
      delete listenerInstances[name];
    }
  });

  const newListeners = currentListenerNames.filter((name) => {
    return !activeListenerNames.includes(name);
  });

  for (const listener of newListeners) {
    let network: SupportedNetwork;
    if (listener.base === ChainBase.Substrate)
      network = SupportedNetwork.Substrate;
    else if (listener.network === ChainNetwork.Compound)
      network = SupportedNetwork.Compound;
    else if (listener.network === ChainNetwork.Aave)
      network = SupportedNetwork.Aave;
    else if (listener.network === ChainNetwork.Moloch)
      network = SupportedNetwork.Moloch;

    try {
      listenerInstances[listener.chain_id] = await createListener(listener.chain_id, network, {
        address: listener.address,
        archival: false,
        url: chain.private_url || chain.url,
        spec: chain.substrate_spec,
        skipCatchup: false,
        verbose: false, // using this will print event before chain is added to it
        enricherConfig: { balanceTransferThresholdPermill: 10_000 },
        discoverReconnectRange
      });
    } catch (error) {
      delete listeners[chain.id];
      await handleFatalError(error, pool, chain.id, 'listener-startup');
      continue;
    }
  }

}

export async function queryDb(pool: Pool, query: string, ...args) {
  if (args) {
    const result = await pool.query(format(query, ...args))
    return result.rows;
  } else {
    const result = await pool.query(query);
    return result.rows;
  }
}

export function getListenerNames(listenerInstances: IListenerInstances): string[] {
  const activeListenerInstances = [];
  for (const listenerName of Object.keys(listenerInstances)) {
    if (!listenerName.startsWith(ChainNetwork.ERC20) &&
      !listenerName.startsWith(ChainNetwork.ERC721)) activeListenerInstances.push(listenerName);
    else {
      activeListenerInstances.push(listenerInstances[listenerName].options.tokenNames);
    }
  }

  return activeListenerInstances;
}
