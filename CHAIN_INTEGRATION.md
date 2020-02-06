> A guide to integrating new blockchains into Commonwealth.

## Table of Contents

- [Introduction](#introduction)
- [Server](#server)
- [Adapters](#adapters)
- [Controllers](#controllers)
  * [Main Chain Adapter](#ichainadapter)
  * [Chain Module](#ichainmodule)
  * [Accounts Module](#iaccountsmodule)
  * [Account Type](#account-type)
  * [Proposal Module](#proposalmodule)
  * [Proposal Type](#proposal-type)
- [Views](#views)

## Introduction

The purpose of this document is to explain the process of adding a new chain to Commonwealth. Adding a chain involves modifying several layers of logic, both on the server and database level, and on the client. This document should walk through the necessary pieces of each layer and explain their relationships.

Note that this document is targeting the "adapter" flow, in which most chain interaction is performed on the client, and not the newer, server-focused "chain object" flow. A separate document will be written for the latter once its procedures are finalized.

## Server

The Commonwealth application depends on a hosted server. This server communicates with a postgres database, managing its **models**, and exposes various **routes** for client communication.

Updating the server is the first step for adding a new chain:

* The `server.ts` file specifies the initial setup logic, specifically the `resetServer()` call.
  * Within `resetServer()`, the new chain should be added as a `Chain` model through a new `models.Chain.create` call. Separate models should be added for local, testnet, and mainnet, if the distinction applies.
  * The new chain's endpoint must also be added to the `nodes` array, to create a corresponding `ChainNode` model for the new chain.
  * These settings will be applied upon the next call to `yarn reset-server`.
  * New chain additions also require a migration, which creates the `Chain` model without resetting the database's contents.
    * An example migration can be found in the file `server/migrations/20191119071445-add-eth-chain.js`.
    * For more information about migration commands, reference the [main README](https://github.com/hicommonwealth/commonwealth/blob/master/README.md#migrations)
      * TODO: expand information about migrations in general.
* When the site initializes, all `Chains` and `ChainNodes` are loaded, so no further server changes are needed.

## Adapters

The "adapter" layer's purpose was to create a set of interfaces shared by both the client and server. The reason for code sharing was to support the "proposal archiving" feature, which has since been deprecated. As a result of this deprecation, Adapters are now considered a part of the client. The adapter layer is subject to change with the "chain object" flow mentioned in the [introduction][#introduction].

The specific goal of the adapter was to provide a unified interface across various chains for fetching new proposals and their state updates, in a real-time, or push-oriented manner.

**NOTE: the adapter layer may be omitted altogether from your chain implementation, although it must then be "faked" at the controller level.**

For now, we will walk through the adapter layer as it exists.

* The primary interface for an adapter is the abstract class `ProposalAdapter`, found in the `shared/adapters/shared.ts` file.
* Implementing a `ProposalAdapter` requires implementing two interfaces, identified as `ConstructionT` and `StateT`, and two abstract methods: `subscribeNew` and `subscribeState`
  * The `ConstructionT` should be an interface containing all immutable info for a proposal (i.e. unchanging over its lifetime). It must contain an `identifier` field, which should be unique across all proposals of the type.
  * The `StateT` should be an interface containing all properties that change over its lifetime, i.e. its mutable state. It must contain the same `identifier` field as the corresponding `ConstructionT`, as well as a `completed` field, marked `true` when a proposal reaches its final state.
  * The `subscribeNew` method takes an `ApiT`, a data provider object that may be user or externally-defined, and produces a rxjs `Observable` which should emit new `ConstructionT` objects as they are added to the chain.
  * The `subscribeState` method takes an `ApiT` as well as a `ConstructionT`. It returns an rxjs `Observable` which should emit new `StateT` objects as properties change on the Proposal identified by the provided `ConstructionT`.
* Adapters for a chain are found in the `shared/adapters/chain/<chain-name>` directory.
* Each adapter consists of two files: `subscriptions.ts` and `types.ts`.
* The `types.ts` file consists of interfaces which implement the `ConstructionT` and `StateT` constraints described above.
  * Each sort of proposal on a chain should have one such pair of interfaces.
  * The naming convention for these interfaces is `I<Chain><ProposalType>[State]`, e.g. `IEdgewareSignalingProposal` and `IEdgewareSignalingProposalState`.
* The `subscriptions.ts` file implements each `ProposalAdapter` class required by the chain.
  * The `edgeware/subscriptions.ts` file uses a native rxjs data provider API (polkadot-js/api), and as such may be difficult to read.
  * The `cosmos/subscriptions.ts` file uses a custom API based on a combination of REST endpoint queries and websocket subscriptions. Its adapters file may be easier to read.
* As mentioned at the top of the section, some chains omit the adapters layer besides specifying their `Coin` type. See `near/types.ts` or `ethereum/types.ts` for examples.

## Controllers

### IChainAdapter

The controller logic represents the primary interface between chain data and the Commonwealth view. The required classes are defined in `client/scripts/models/models.ts`. They are structured as follows:

* Each chain should have a "main" class that extends `IChainAdapter` defined in a file `client/scripts/controllers/chain/<chain-name>/main.ts` (e.g. the `Cosmos` class). This is typically accessed via `app.chain` when a given chain is active.
* This `IChainAdapter` class takes as type arguments a `Coin` type (typically defined in the [adapters](#adapters) `types.ts` file, and an `Account` type, typically defined alongside the `IAccountsModule` described below).
* This `IChainAdapter` class should define the following properties and methods:
  * All chain modules should be defined as properties:
    * `chain` should be an `IChainModule`, described below.
    * `accounts` should be an `IAccountsModule`, described below.
    * Any governance interfaces should be defined as properties of type `ProposalModule`, described below. These are optional.
  * To support Commonwealth discussion, all "server controllers" should be entries in the `server` property:
    * `server.threads` should be a `ThreadsController`.
    * `server.comments` should be a `CommentsController`.
    * `server.reactions` should be a `ReactionsController`.
    * `server.profiles` should be a `ProfilesController`.
  * `base` and `class` should be defined as entries in the `ChainBase` and `ChainClass` enums in the `models.ts` file.
  * `init` should be defined as an `async` function that initializes all server controllers and chain modules, and `deinit` should be an async function that deinitializes all controllers and modules.

Next we will discuss the structure of each chain module.

### IChainModule

The interface `IChainModule` specifies required properties for the general chain functionality.

* The `IChainModule` is typically implemented in the file `client/scripts/controllers/chain/<chain-name>/chain.ts`.
* This `IChainModule` requires type arguments of a `Coin` type and an `Account` type, same as the `IChainAdapter`.
* This `IChainModule` implementation is typically accessed via `app.chain.chain`.
* This `IChainModule` requires the following implemented methods:
  * `coins()` should be a function that creates a new `Coin` of the specified chain's type, used throughout as `app.chain.chain.coins()` to create the chain-specific currency.
  * `denom` should be a string specifying the currency's token denomination, e.g. "EDG".
  * `hasWebWallet()` should be a function that returns `true` iff the given chain has a web wallet extension available. (TODO: when was this added?)
  * `createTXModalData()` is a function for initializing the transaction modal. This is invoked whenever the user makes an action that requires a transaction on the chain.
    * `createTXModalData()` should return an `ITXModalData` object (or promise which resolves to an `ITXModalData`). `ITXModalData` should have the following properties:
      * `author` should be an `Account` of the type specified in the `IChainModule` argument. This is the sender of the transaction.
      * `txType` should be a `string` corresponding to the unique label of the transaction being performed.
      * `txData` should be an object containing two functions: `unsignedData` and `transact`.
      * `txData.unsignedData()` should be an async function that returns a blob of data, which can be signed by some external utility, such as `subkey` in the case of Substrate.
      * `txData.transact()` should be a function that uses the arguments passed into `createTXModalData()` to broadcast the corresponding transaction when the user clicks the submit button.
      * `cb` is an optional property, containing a callback triggered upon modal exit. It takes the success of the transaction as a boolean argument.
    * The method `createTXModalData()` should take the following arguments:
      * `author` should be an `Account` of the type specified as an argument. This should be passed along to the corresponding `ITXModalData`.
      * `txFunc` should be a function that performs the transaction given some chain-specific arguments. This is typically called in `txData.transact()`, when the user attempts to perform the transaction.
        * In Substrate's case, `txFunc` is a function that takes a polkadot-js `ApiRx` type and returns a `Call` object corresponding to an exposed method on the chain.
        * In Cosmos' case, `txFunc` is an async function that takes some amount of gas and returns sufficient data to broadcast a transaction on the chain.
        * The specific nature of this function is defined on a per-chain basis.
      * `txName` should be a string referencing the name of the transaction.
      * `objName` should be a string referencing the name of the object being transacted. This may or may not be used during the transaction process to present information about the transaction's status.
      * `cb` is an optional post-transaction callback, passed along to the `ITXModalData` described above.
* The `IChainModule` may also contain `init` and `deinit` methods, invoked in the `IChainAdapter`'s corresponding `init` and `deinit` methods. These are useful for connecting to the chain via the chain's API, fetching chain properties, and initializing long-running chain subscriptions.
  * The `networkStatus` property on the `IChainAdapter` may be set in these methods.
* The `IChainModule` may also contain whatever useful chain-wide properties the implementation requires in its other modules or on chain-specific views.

### IAccountsModule

The `IAccountsModule` provides a small interface for a chain's accounts module.

* The `IAccountsModule` is typically implemented in the file `client/scripts/controllers/chain/<chain-name>/account.ts`.
* This `IAccountsModule` requires type arguments of a `Coin` type and an `Account` type, same as `IChainModule` and `IChainAdapter`.
  * Most of the account-related implementation work takes place in the `Account` type passed as an argument. This is described [below](#account-type).
* This `IAccountsModule` implementation is typically accessed via `app.chain.accounts`.
* This `IAccountsModule` requires a single implemented method, `get()`, which takes an address and an optional keytype and returns an `Account` of the provided type.
  * The function of `get()` is to provide a chain-agnostic `app.chain.accounts.get()` call, to fetch an account regardless of chain.
* The `IAccountsModule` is extended from `StorageModule`, meaning it requires an implemented getter `store`.
  * The `store` is optional, but if implemented, should refer to a `Store` object specialized for the `Account` class provided as type argument.
  * The function of the `Store` is to provide a general interface for locally and ephemerally storing and querying objects of a specific type.
  * The definition of `Store` can be found in `client/scripts/models/stores.ts`.
* The `IAccountsModule` may also contain `init` and `deinit` methods, invoked in the `IChainAdapter`'s corresponding `init` and `deinit` methods.

### Account Type

The abstract `Account` class should be extended by any new chain. This `Account` class is intended to provide a unified interface for interacting with chain addresses containing balances that may or may not correspond with registered users on the Commonwealth backend.

* The `Account` class is typically implemented alongside the `IAccountsModule` in the file `client/scripts/controllers/chain/<chain-name>/account.ts`.
* The `Account` class requires a `Coin` type argument.
* The `Account` class always contains the following core properties:
  * An `address` string, representing the raw address of the account.
  * A `chainBase` and `chainClass` corresponding with the `IChainAdapter`.
  * A `balance` getter, which provides an rxjs `Observable` that emits the balance corresponding to the provided address.
* The `signMessage` and `isValidSignature` functions should be implemented if key-based signing for transactions or account registration is supported on the chain. Otherwise, they should throw an Error.
* The `addressFromMnemonic` and `addressFromSeed` functions should be implemented for testing purposes, if accounts correspond to seeds or mnemonics. Otherwise, they should throw an Error.
  * **Commonwealth accounts should never request or store a seed or mnemonic when connecting to a production chain.**
* If balance transfers are supported on the chain, the `sendBalanceTx` function should implement a balance transfer transaction using the `createITXModalData` function defined in the `IChainModule`. Otherwise, it should throw an Error.

### ProposalModule

### Proposal Type

## Views