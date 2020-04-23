# Introduction

The purpose of the "events" modules are to hook various chains into the Commonwealth notifications system, such that incoming chain events (like staking rewards, governance actions, etc) trigger the creation and display of user-facing notifications.

# Adding a new event to an existing chain

Adding a new Edgeware event requires the following steps:

1. Add a new item to the `SubstrateEventKind` enum in [types.ts](edgeware/types.ts)
1. Create an appropriate interface for the event's data in [types.ts](edgeware/types.ts). The `kind` string should be the previously added item from `SubstrateEventKind`.
2. Add the new interface to the `ISubstrateEventData` union type.
3. Add the new event type to the filters, as follows:
  * In [type_parser.ts](edgeware/filters/type_parser.ts), you must add a new mapping from the on-chain event's section and method strings to the `SubstrateEventKind` item added in step 1.
  * In [enricher.ts](edgeware/filters/enricher.ts), you must add a new case for the `SubstrateEventKind` item added in step 1, and return an object as described by the event's interface. If additional chain data is needed, this is where you should fetch it.
  * In [titler.ts](edgeware/filters/titler.ts), you must add a new case for the `SubstrateEventKind` item added in step 1, which returns an event title and description of that kind of event. Note that this is a type-wide title, not specific to individual instances of the event.
  * In [labeler.ts](edgeware/filters/labeler.ts), you must add a new case for the `SubstrateEventKind` item added in step 1, which uses the event's object to return a new object as described by `IEventLabel`. The `heading` should be considered the notification title, the `label` should be considered the notification description and the `url` should be considered an onclick link for the notification.
4. Test out your change by triggering the event on a local testnet, and/or by writing a test case for the processor, in [processor.spec.ts](../../test/unit/events/edgeware/processor.spec.ts).

# Adding a new chain

A new chain must include all components specified in [interfaces.ts](interfaces.ts): a set of types, a subscriber, a poller, a processor, and an event handler, as well as a filters folder that includes a labeler and a titler.

A new chain should also include an index file that initializes the chain's event handling setup.

The new chain should use the same style of type definition as Edgeware, a set of interfaces with string enum kinds. The new chain should expose a union of interface types that should be added to the `IChainEventData` and `IChainEventKind` union types in [interfaces.ts](interfaces.ts). The new chain's "id" string should also be added to the `EventSupportingChains` array in [interfaces.ts](interfaces.ts), although we might shift to a database-oriented approach in the future.

The new labeler function should be added to [header.ts](../../client/scripts/views/components/header.ts) as a separate import, and should be conditionally invoked as needed.

The new titler function and chain should be added to [subscriptions.ts](../../client/scripts/view/pages/subscriptions.ts), specifically as cases in the `EventSubscriptions` Mithril object.