## Introduction

The purpose of the "events" modules are to hook various chains into the Commonwealth notifications system, such that incoming chain events (like staking rewards, governance actions, etc) trigger the creation and display of user-facing notifications.

## Upgrading

If running an older version of Commonwealth, you must do the following to prepare your application for the chain entity feature.

1. The database must be upgraded to the current version. This can be done by running the sequelize migration via `npx sequelize db:migrate`, which will maintain the database's current rows, or alternatively by a full reset of the server, via `yarn reset-server`.
2. Once the server is upgraded, the current state of the network must be initialized, and old chain events which relate to entities must be upgraded to their current versions and linked with the corresponding entity. To perform this initialize, run `yarn migrate-events`, which should initialize all chains in the db that are also supported in `EventSupportingChains`.
3. Once the event migration is completed successfully, the app can be run as normal, with `yarn start`.

## Adding a new event

An "event" is any action occuring on chain to which we can subscribe (receiving via push), fetch contextual data about, and store in our database.

Adding a new Edgeware event requires the following steps:

1. Add a new item to the `SubstrateEventKind` enum in [types.ts](edgeware/types.ts)
2. Create an appropriate interface for the event's data in [types.ts](edgeware/types.ts). The `kind` string should be the previously added item from `SubstrateEventKind`.
3. Add the new interface to the `ISubstrateEventData` union type.
4. Add the new event type to the filters, as follows:
  * In [type_parser.ts](edgeware/filters/type_parser.ts), you must add a new mapping from the on-chain event's section and method strings to the `SubstrateEventKind` item added in step 1.
  * In [enricher.ts](edgeware/filters/enricher.ts), you must add a new case for the `SubstrateEventKind` item added in step 1, and return an object as described by the event's interface. If additional chain data is needed, this is where you should fetch it. Note that **if the event is an extrinsic and not a Substrate event, the corresponding switch statement is beneath, in `extractExtrinsicData` rather than `extractEventData`**.
  * In [titler.ts](edgeware/filters/titler.ts), you must add a new case for the `SubstrateEventKind` item added in step 1, which returns an event title and description of that kind of event. Note that this is a type-wide title, not specific to individual instances of the event.
  * In [labeler.ts](edgeware/filters/labeler.ts), you must add a new case for the `SubstrateEventKind` item added in step 1, which uses the event's object to return a new object as described by `IEventLabel`. The `heading` should be considered the notification title, the `label` should be considered the notification description and the `url` should be considered an onclick link for the notification.
5. If the event relates to an existing _entity_ (see ["Adding a new entity"](#Adding-a-new-entity) below), then perform the following steps to include the new event in the entity's processing:
  * Ensure your interface from step 3 contains the same identifying item as the rest of the events relating to that entity.
  * In [entityArchival.ts](../../server/eventHandlers/edgeware/entityArchival.ts), add the appropriate `createEntityFn` or `updateEntityFn` case for the new event.
  * If a migration of historical event data should be performed for the new event (typically not necessary), then you must add the event to the "auxiliary" union types at the bottom of [types.ts](edgeware/types.ts), and also to the `eventToEntity` function in [interfaces.ts](interfaces.ts). Additionally, you must add API queries that enable you to synthesize the event in [migration.ts](edgeware/migration.ts).
6. Test out your change by triggering the event on a local testnet, and by writing a test case for the enricher, in [enricher.spec.ts](../../test/unit/events/substrate/enricher.spec.ts).

## Adding a new entity

An "entity" is a stateful object on a given chain, whose major state updates are emitted as events, such as proposals. We store entities in a database table with an identifer and a list of associated events.

To add a new entity to Edgeware, you must perform the following steps:

1. Determine a list of events that correspond to the particular entity. Each event type can only correspond to a single type of entity, so ensure that the correspondence is essential (e.g. do not associate preimage events with the democracy proposal entity, preimages should be their own type of entity).
2. Determine what the entity's immutable identifier will be, such as an index or hash, and ensure all orresponding event interfaces contain that identifier. This may require updating the event's interface and [enricher.ts](edgeware/filters/enricher.ts) step.
3. Add the appropriate cases to [entityArchival.ts](../../server/eventHandlers/edgeware/entityArchival.ts) that create and update the entity's state.
4. (Optional) If fetching historical data is needed to initialize storage of the new entity, then you must do as follows:
  * Add cases for synthesizing the entity's events to [migration.ts](edgeware/migration.ts).
  * Add auxiliary types and `eventToEntity` cases at the bottom of [types.ts](edgeware/types.ts).
  * Add the new entity type to the [migration event handler](../../server/eventHandlers/edgeware/migration.ts).
  * Add corresponding unit tests to [migration.spec.ts](../../test/unit/events/substrate/migration.spec.ts) and optionally to [migrationHandler.spec.ts](../../test/unit/events/substrate/migrationHandler.spec.ts)
5. If required, update all corresponding controllers on the client side to handle the new entity.
6. Test out your change by triggering the corresponding sequence of events on a local testnet (this may require migration as per [Upgrading](#Upgrading), and, if so, step 4 is mandatory), and ensuring the entity's fields and associations are populated as expected. Also consider testing by adding a test case to [entityArchivalHandler.spec.ts](../../test/unit/events/substrate/entityArchivalHandler.spec.ts).

### What is a migration?

In the previous two sections, I mention the idea of a migration, which initializes storage. I'd like to discuss the specifics and use case of this migration, to demonstrate its role in event handling why it might be necessary.

Consider the following timeline, assuming each state update event affects the proposal created on block 2:

```
blocks     events         database
  1
  2      new proposal      offline
  3                        offline
  4      state update 1    offline
  5                        online
  6      state update 2    online
  7
  |
  V
```

In the timeline above, the database comes online at block 5, but two proposal events have already taken place, at blocks 2 and 4 respectively. If we assume the database is freshly initialized, then we will only receive the "state update 2" event, missing the prior events. However, the logic of chain entities requires that we have a list of all events relating to that entity in sequence. How do we solve this, and construct a full proposal despite only seeing one of its state updates?

The naive answer is to fetch all prior blocks. However, most chains perform a degree of pruning, and discard past block data. On Substrate, the pruning time is set to 250 blocks by default. Most proposals have timelines on the order of days, which means gaps of at least 14,000 blocks between events. Thus, we will be unable to simply fetch the historical events as they occurred on chain. We will need to _reconstruct_ prior events in order to obtain the complete data required to display the proposal. How can we do this?

Substrate exposes a set of queryable storage objects, which we can ask for at any time (or even subscribe to updates for), and which contain some subset of proposal state. Thus the role of a migration is to query the specific storage objects and use the data to reconstruct "fake" chain events, as they may have happened at an earlier moment on the chain. We use these events to initialize the state of any extant chain object, so that incoming updates, such as "state update 2", affect a pre-existing object rather than referring to some unknown entity on chain.

In particular, we differentiate between two types of entity-affecting events: creation events, and update events. The [entityArchival.ts](../../server/eventHandlers/edgeware/entityArchival.ts) event handler is where this distinction is logically manifest: certain events involve creating new entities, others involve updating existing entities in the database. Thus, the [migration.ts](edgeware/migration.ts) fetcher attempts first to reconstruct the creation events for each extant on-chain entity, and then attempts to reconstruct state updates as thoroughly as possible.

This system as some limitations:
  * In some cases we are unable to reconstruct the full event as it would have been emitted, due to the subset of data kept in storage. In these cases, we simply leave the field blank, and do our best to work around the lack of information. Thankfully, none of the omitted data elements are highly significant to the entity. One such example is a passed democracy referendum's "vote threshold": it is already known to have passed, so the vote threshold under which it passed is of marginal concern.
  * In most cases, we are unable to determine the exact block when an event would have occurred. Luckily, we do not rely on the event emission block for the majority of the entity logic. The migration generates events as if they occurred on the block when we ran the migration.
  * If an entity has been fully processed and removed from the chain at the time the migration is run, such as a fully passed and executed proposal, we're often unable to fetch any information about it. This limits the extent of our archiving to the set of active entities when the database is first migrated, but should not have any impact on exposing possible user actions. Fully processed entities, definitionally, have no valid user interactions. They are finished, and maintaining them is useful for historical purposes only.

The migration system is designed to handle one other case. Consider if we ran the event handler for a while, and if, at some point, the interfaces to certain events, as defined in [types.ts](edgeware/types.ts), were updated to add additional information. In this case, where we have stored events with "old" interfaces that may be insufficient to back the desired state of the entity, we attempt to "upgrade" all existing events during the process of migration. This looks effectively the same as reconstructing the event from nothing, except we overwrite the underlying event data rather than creating a new event in the database.

## Adding a new chain

A new chain must include all components specified in [interfaces.ts](interfaces.ts): a set of types, a subscriber, a poller, a processor, and an event handler, as well as a filters folder that includes a labeler and a titler.

A new chain should also include an index file that initializes the chain's event handling setup.

The new chain should use the same style of type definition as Edgeware, a set of interfaces with string enum kinds. The new chain should expose a union of interface types that should be added to the `IChainEventData` and `IChainEventKind` union types in [interfaces.ts](interfaces.ts). The new chain's "id" string should also be added to the `EventSupportingChains` array in [interfaces.ts](interfaces.ts), although we might shift to a database-oriented approach in the future.

The new labeler function should be added to [header.ts](../../client/scripts/views/components/header.ts) as a separate import, and should be conditionally invoked as needed.

The new titler function and chain should be added to [subscriptions.ts](../../client/scripts/view/pages/subscriptions.ts), specifically as cases in the `EventSubscriptions` Mithril object.

The new chain should also add entities as needed for various stateful objects, such as proposals.