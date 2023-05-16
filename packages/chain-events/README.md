# @commonwealth/chain-events

Chain Events is a library for subscribing and processing synthetic blockchain events.

## Standalone Usage

This package includes an "event listener" script located at [listener.ts](./scripts/listener.ts),
which permits real-time listening for on-chain events, and can be used for testing a chain connection, pushing events to
a queue, or/and running chain-events as a node.

The following is an example usage, connecting to a local node running on edgeware mainnet:

```bash
~/chain-events$ yarn build
~/chain-events$ yarn listen -n edgeware -u ws://localhost:9944
```

The full set of options is listed as, with only `-n` required:

```
Options:
      --help             Show help                                     [boolean]
      --version          Show version number                           [boolean]
  -z, --config           Path to a config file to setup multiple        [string]
                         listeners (see below)
  -n, --network          chain to listen on
          [required] [choices: "edgeware", "edgeware-local", "edgeware-testnet",
     "kusama", "kusama-local", "polkadot", "polkadot-local", "kulupu", "moloch",
                                                                 "moloch-local"]
  -u, --url              node url                                       [string]
  -a, --archival         run listener in archival mode                 [boolean]
  -b, --startBlock       when running in archival mode, which block     [number]
                         should we start from
  -s, --skipCatchup      Whether to attempt to retrieve historical     [boolean]
                         events not collected due to down-time
  -c, --contractAddress  eth contract address                           [string]
  -q, --rabbitmq         Publish messages to queue hosted on RabbitMQ  [boolean]
  -e, --eventNode        Run chain-events as a node that allows        [boolean]
                         interacting with listeners over http
                         (only updating substrate specs for now)
```

If the -z option is passed then only -q and -e can be used (all other options conflict with the config defined by -z)

#### Environment Variables

- NODE_ENV: dictates where a listener will get its initial spec. when NODE_ENV = "production"
  the listener gets its spec from commonwealth.im. Otherwise, the listener will get its spec from the commonwealth server
  hosted locally.

#### Listener config file

Must be a json file with the following format:

```json
[
  {
    "network": "Required (string) - The name of the network",
    "url": "Optional (string) - Node url to connect to",
    "archival": "Optional (boolean) - run listener in archival mode",
    "startBlock": "Optional (number) - when running in archival mode, which block should we start from",
    "skipCatchup": "Optional (boolean) - Whether to attempt to retrieve historical events not collected due to down-time",
    "excludedEvents": "Optional (array of strings) - An array of EventKinds to ignore. Currently only relevant for the RabbitMQ producer."
  }
]
```

See manyListenerConfigEx.json for an example configuration

## Library Usage

The easiest usage of the package involves using the Listener class which initializes the various components. Do this
for Substrate chains as follows:

```typescript
import { Listener as SubstrateListener } from 'chain-events/src';

// TODO: listener argument docs
// create a listener instance
const listener = new SubstrateListener();

// initialize the listener
await listener.init();

// subscribe/listen to events on the specified chain
await listener.subscribe();
```

The Listener classes have a variety functions that facilitate using the listener.

##### Updating the substrate spec

```typescript
await listener.updateSpec({ yourNewSpec });
```

##### Updating the url the listener should use

```typescript
await listener.updateUrl('yourNewUrl');
```

##### Changing the event handlers

The event handlers are accessible through the `eventHandlers` property.
The eventHandlers property is defined as follows:

```
eventHandlers: {
  [handlerName: string]: {
    "handler": IEventHandler,
    "excludedEvents": SubstrateEvents[]
  }
}
```

Thus, to change an event handler, or the events that it ignores simply access it directly:

```typescript
// change the handler of "myEventHandler"
listener.eventHandlers['myEventHandler'].handler = newHandler;
```

##### Changing the excluded events

As described above you can change the events that a handler ignores either directly in the execution of the handler
or by setting "excludedEvents" like so:

```typescript
// change the events "myEventHandler" excludes
listener.eventHandlers['myEventHandler'].excludedEvents = [
  'someEventKind',
  'anotherEventKind',
];
```

You can also exclude events from all handlers at one by changing the globalExcludedEvents property like so:

```typescript
listener.globalExcludedEvents = ['someEventKind', 'anotherEventKind'];
```

### Provided Handlers

##### RabbitMQ Producer

##### HTTP Post Handler

##### Single Event Handler

### Custom Handlers

A custom handler is necessary in many cases depending on what you are trying to build. Thankfully creating your own
is very easy!

Just extend the `IEventHandler` and implement the `handle` method:

```typescript
import { CWEvent, IEventHandler } from 'chain-event-types';

class ExampleEventHandler implements IEventHandler {
  public async handle(event: CWEvent): Promise<void> {
    // your code goes here
  }
}
```

In order to use chain-event-types in your project you will need to install chain-event-types from
'git+https://github.com/timolegros/chain-events.git#build.types' and have the following dev dependencies:

- '@polkadot/types'
- '@polkadot/api'

The easiest usage of the package involves calling `subscribeEvents` directly, which initializes the various components automatically. Do this for Substrate as follows.

```typescript
import { spec } from '@edgeware/node-types';
import {
  SubstrateEvents,
  CWEvent,
  IEventHandler,
} from '@commonwealth/chain-events';

// This is an example event handler that processes events as they are emitted.
// Add logic in the `handle()` method to take various actions based on the events.
class ExampleEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<void> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

async function subscribe(url) {
  // Populate with chain spec type overrides
  const api = await SubstrateEvents.createApi(url, spec);

  const handlers = [new ExampleEventHandler()];
  const subscriber = await SubstrateEvents.subscribeEvents({
    api,
    chain: 'edgeware',
    handlers,

    // print more output
    verbose: true,

    // if set to false, will attempt to poll past events at setup time
    skipCatchup: true,

    // if not skipping catchup, this function should "discover" the most
    // recently seen block, in order to limit how far back we attempt to "catch-up"
    discoverReconnectRange: undefined,
  });
  return subscriber;
}
```

Alternatively, the individual `Subscriber`, `Poller`, `StorageFetcher`, and `Processor` objects can be accessed directly on the `SubstrateEvents` object, and
can be set up directly. For an example of this, see the initialization procedure in [subscribeFunc.ts](src/chain-bases/substrate/subscribeFunc.ts).

### Class Details

The top level `@commonwealth/chain-events` import exposes various abstract types from the [interfaces.ts](./src/interfaces.ts) file, as well as "per-chain" modules, e.g. for Substrate, `SubstrateTypes` and `SubstrateEvents`, with the former containing interfaces and the latter containing classes and functions.

The two main concepts used in the project are "ChainEvents" and "ChainEntities".

- A "ChainEvent" represents a single event or extrinsic call performed on the chain, although it may be augmented with additional chain data at production time. ChainEvents are the main outputs generated by this project.
- A "ChainEntity" represents a stateful object on chain, subject to one or more "ChainEvents" which manipulate its state. The most common usage of ChainEntity is to represent on-chain proposals, which may have a pre-voting phase, a voting phase, and a period post-voting before the proposal is marked completed, each phase transition represented by events that relate to the same object. **This project defines types and simple utilities for ChainEntities but does not provide any specific tools for managing them.**

Each chain implements several abstract classes, described in [interfaces.ts](./src/interfaces.ts). The list for Substrate is as follows:

- `Subscriber` exposes a `subscribe()` method, which listens to the chain via the API and constructs a synthetic `Block` type when events occur, containing necessary data for later processing.
- `Poller` exposes a `poll()` method, which attempts to fetch a range of past blocks and returns an Array of synthetic `Block`s. This is used for "catching up" on past events.
- `StorageFetcher` exposes a `fetch()` method, which queries chain storage and constructs "fake" `Block`s, that represent what the original events may have looked like. This is used to quickly catch up on stateful Chain Entities from chains that prune past blocks (as most do).
- `Processor` exposes a `process()` method, which takes a synthetic `Block` and attempts to convert it into a `CWEvent` (aka a ChainEvent), by running it through various "filters", found in the [filters](src/chain-bases/substrate/filters) directory. The primary filter types used are as follows:
  - `ParseType` uses data from the chain to detect the ChainEvent kind of a `Block`. It is used to quickly filter out blocks that do not represent any kind of ChainEvent.
  - `Enrich` uses the API to query additional data about a ChainEvent that did not appear in the original `Block`, and constructs the final `CWEvent` object. This is used because many "events" on chains provide only minimal info, which we may want to augment for application purposes.
  - Two other filters exist, which are not used by the `Processor`, but may be useful in an application:
    - `Title` takes a kind of ChainEvent and produces an object with a title and description, useful for enumerating a human-readable list of possible ChainEvents.
    - `Label` takes a specific ChainEvent and produces an object with a heading, a label, and a linkUrl, useful for creating human-readable UIs around particular events. The `linkUrl` property in particular is currently specific to [Commonwealth](https://commonwealth.im/), but may in the future be generalized.

Note that every item on this list may not be implemented for every chain (e.g. Moloch does not have a `Poller`), but the combination of these components provides the pieces to create a more usable application-usable event stream than what is exposed on the chain.

### Usage as Commonwealth Chain-Events DB Node

Running chain-events as a CW DB node lets us run a cluster of chain-events node each with multiple listeners without
needing for each of them to be aware of each other or implementing load-balancing. This is achieved by having the chain
events DB nodes poll the database for the information that is specific to them.

####Environment Variables

- `NUM_WORKERS`: The total number of chain-events DB nodes in the cluster. This is used to ensure even separation of
  listeners among the different chain-events DB nodes.
- `WORKER_NUMBER`: The unique number id that this chain-events DB node should have. Must be between 0 and NUM_WORKERS-1
- `HANDLE_IDENTITY`: ("handle" || "publish" || null)

  - handle: The node will directly update the database with identity data
  - publish: The node will publish identity events to an identity queue
  - null: The node will not query the identity cache

- `NODE_ENV`: ("production" || "development") - optional
- `DATABASE_URL`: The url of the database to connect to. If `NODE_ENV` = production this url is the default.
- `PGPASSWORD`: [OPTIONAL] avoids the password prompt for all local database commands
- `ETH_ALCHEMY_API_KEY`: [OPTIONAL] if set, the load-db commands will replace production Alchemy urls with their locally supported variants
