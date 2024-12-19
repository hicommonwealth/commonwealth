# EVM Chain Events

There are 2 methods of adding chain events sources. Parent contracts are contracts that we (Common) deploy and child
contracts are contracts deployed by users (e.g. Single Contests). Parent contract addresses are stable (almost never
change) and are therefore hardcoded in `chainConfig.ts`. On the other hand, we cannot know the address of a child
contract ahead of time since it is deployed at runtime. For this reason, child contract sources are stored in the
EvmEventSources table with a reference to the parent contract in the EventRegistry.

These instructions only describe how to ensure events are picked it up by EVM CE _not_ how these events are processed.

## Adding Parent Contract Events
1. Add the contract address in the `factoryContracts` object in `chainConfig.ts`.
2. Add the relevant event signatures in `eventSignatures.ts`.
3. Update the `EventRegistry` object in `eventRegistry.ts` to reference the new contract/event.

## Adding Child Contract Events
1. Add the relevant event signatures in `eventSignatures.ts`.
2. Update the `EventRegistry` object in `eventRegistry.ts` to reference the new events.
3. Ensure that the parent events pertaining to child contract launches create sources in the `EvmEventSources` table.