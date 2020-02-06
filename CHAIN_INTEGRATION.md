# Commonwealth Chain Integration

A guide to integrating new blockchains into Commonwealth.

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Server](#2-server)
- [3. Adapters](#3-adapters)
  * [3.1. Coin](#31-coin)
- [4. Controllers](#4-controllers)
  * [4.1. Main Chain Adapter](#41-ichainadapter)
  * [4.2. Chain Module](#42-ichainmodule)
  * [4.3. Accounts Module](#43-iaccountsmodule)
  * [4.4. Account Type](#44-account-type)
  * [4.5. Proposal Module](#45-proposalmodule)
  * [4.6. Proposal Type](#46-proposal-type)
- [5. App Integration](#5-app-integration)
  * [5.1. Identifiers](#51-identifiers)
  * [5.2. Initialization](#52-initialization)
  * [5.3. Views](#53-views)

## 1. Introduction

The purpose of this document is to explain the process of adding a new chain to Commonwealth. Adding a chain involves modifying several layers of logic, both on the server and database level, and on the client. This document should walk through the necessary pieces of each layer and explain their relationships.

Note that this document is targeting the "adapter" flow, in which most chain interaction is performed on the client, and not the newer, server-focused "chain object" flow. A separate document will be written for the latter once its procedures are finalized.

## 2. Server

The Commonwealth application depends on a hosted server. This server communicates with a postgres database, managing its **models**, and exposes various **routes** for client communication.

Updating the server is the first step for adding a new chain:

* The `server.ts` file specifies the initial setup logic, specifically the `resetServer()` call.
  * Within `resetServer()`, the new chain should be added as a `Chain` model through a new `models.Chain.create` call. Separate models should be added for local, testnet, and mainnet, if the distinction applies.
  * The new chain's endpoint must also be added to the `nodes` array, to create a corresponding `ChainNode` model for the new chain.
  * These settings will be applied upon the next call to `yarn reset-server`.
  * New chain additions also require a migration, which creates the `Chain` model without resetting the database's contents.
    * An example migration can be found in the file `server/migrations/20191119071445-add-eth-chain.js`.
    * For more information about migration commands, reference the [main README](https://github.com/hicommonwealth/commonwealth/blob/master/README.md#migrations)
* When the site initializes, all `Chains` and `ChainNodes` are loaded, so no further server changes are needed.

## 3. Adapters

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

### 3.1. Coin

Each chain requires a `Coin` object that represents share or token holdings.

* A new chain's token object must build off the `Coin` class, specified in `shared/adapters/currency.ts`.
* Each chain's `Coin` class is specified in their `shared/adapters/chain/<chain-name>/types.ts` file.
* The `Coin` is itself a `BN` (via the BN.js library) with extra currency-related properties. This lets us support larger currency values than the standard Javascript `number` type.
* The `Coin` type must specify a `denomination`, typically the same as the `symbol` in the database `Chain` model.
* The `Coin` type may optionally specify a `dollar` value, some large sum of the "atomic" tokens easier for human reading and entry.
* If a `dollar` value is specified, the `Coin` constructor accepts an `inDollars` flag, to construct a `Coin` object of the correct size from a human entry field that accepts the entry "in dollars".
* The `Coin` type need not contain any additional properties or methods beyond the ones specified in the original `Coin` class. Most chains will only overwrite the constructor.

## 4. Controllers

The controller logic represents the primary interface between chain data and the Commonwealth view. The required classes are defined in `client/scripts/models/models.ts`. The following sections will walk through each relevant model and what information it requires.

### 4.1. IChainAdapter

The `IChainAdapter` module is the "main" class of the chain. It represents the entrypoint into each chain's specific logic, and mainly performs module initialization.

* Each chain should have extend `IChainAdapter` defined in a file `client/scripts/controllers/chain/<chain-name>/main.ts` (e.g. the `Cosmos` class). This is typically accessed via `app.chain` when a given chain is active.
* This `IChainAdapter` class takes as type arguments a `Coin` type (as defined [above](#31-coin)), and an `Account` type, typically defined alongside the `IAccountsModule` described below).
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

Next we will discuss the structure of each chain module and their corresponding classes.

### 4.2. IChainModule

The interface `IChainModule` specifies required properties for the general chain functionality.

* The `IChainModule` is typically implemented in the file `client/scripts/controllers/chain/<chain-name>/chain.ts`.
* This `IChainModule` requires type arguments of a `Coin` type and an `Account` type, same as the `IChainAdapter`.
* This `IChainModule` implementation is typically accessed via `app.chain.chain`.
* This `IChainModule` requires the following implemented methods:
  * `coins()` should be a function that creates a new `Coin` of the specified chain's type, used throughout as `app.chain.chain.coins()` to create the chain-specific currency.
  * `denom` should be a string specifying the currency's token denomination, e.g. "EDG".
  * `hasWebWallet()` should be a function that returns `true` iff the given chain has a web wallet extension available.
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

### 4.3. IAccountsModule

The `IAccountsModule` provides a small interface for a chain's accounts module.

* The `IAccountsModule` is typically implemented in the file `client/scripts/controllers/chain/<chain-name>/account.ts`.
* This `IAccountsModule` requires type arguments of a `Coin` type and an `Account` type, same as `IChainModule` and `IChainAdapter`.
  * Most of the account-related implementation work takes place in the `Account` type passed as an argument. This is described [below](#44-account-type).
* This `IAccountsModule` implementation is typically accessed via `app.chain.accounts`.
* This `IAccountsModule` requires a single implemented method, `get()`, which takes an address and an optional keytype and returns an `Account` of the provided type.
  * The function of `get()` is to provide a chain-agnostic `app.chain.accounts.get()` call, to fetch an account regardless of chain.
* The `IAccountsModule` is extended from `StorageModule`, meaning it requires an implemented getter `store`.
  * The `store` is optional, but if implemented, should refer to a `Store` object specialized for the `Account` class provided as type argument.
  * The function of the `Store` is to provide a general interface for locally and ephemerally storing and querying objects of a specific type.
  * The definition of `Store` can be found in `client/scripts/models/stores.ts`.
* The `IAccountsModule` may also contain `init` and `deinit` methods, invoked in the `IChainAdapter`'s corresponding `init` and `deinit` methods.

### 4.4. Account Type

The abstract `Account` class should be implemented by any new chain. This `Account` class is intended to provide a unified interface for interacting with chain addresses containing balances that may or may not correspond with registered users on the Commonwealth backend.

* The `Account` class is typically implemented alongside the `IAccountsModule` in the file `client/scripts/controllers/chain/<chain-name>/account.ts`.
* The `Account` class requires a `Coin` type argument.
* The `Account` class always contains the following core properties:
  * An `address` string, representing the raw address of the account.
  * A `chainBase` and `chainClass` corresponding with the `IChainAdapter`.
  * A `balance` getter, which provides an rxjs `Observable` that emits the balance corresponding to the provided address.
* The `signMessage` and `isValidSignature` functions should be implemented with key-based signing and signature validation logic for the chain. This is required for linking addresses as part of user accounts.
* The `addressFromMnemonic` and `addressFromSeed` functions should be implemented for testing purposes, if accounts correspond to seeds or mnemonics. Otherwise, they should throw an Error.
  * **Commonwealth accounts should never request or store a seed or mnemonic when connecting to a production chain.**
* If balance transfers are supported on the chain, the `sendBalanceTx` function should implement a balance transfer transaction using the `createITXModalData()` function defined in the `IChainModule`. Otherwise, it should throw an Error.

### 4.5. ProposalModule

The abstract `ProposalModule` class should be implemented by any new chain in order to support on-chain governance. If the new chain has several forms of governance, `ProposalModule` may be implemented multiple times, to define controllers for each of the governance forms.

* The `ProposalModule` is typically implemented in the directory `client/scripts/controllers/chain/<chain-name>/`, with a file name corresponding to the chain's variety of proposal. `governance.ts` works as a default name.
* The `ProposalModule` takes several type arguments:
  * The `ApiT`, `CT`, `ST`, and `AdapterT` correspond to the `ApiT`, `ConstructionT`, `StateT`, and `ProposalAdapter` defined in the [adapter](#3-adapters) section.
  * The `ProposalT` corresponds with the `Proposal` type, defined [below](#46-proposal-type).
* The `ProposalModule` defines the following properties, which should be set in the constructor or `init` method.
  * The `store` property is used for storing and querying `Proposal`s.
  * The `adapter` property corresponds to the adapter, of type `AdapterT`, used to fetch new Proposals (`CT`s) or state updates (`ST`s).
  * The `initialized` property is to be set to `true` once the module is initialized.
  * The `_subscription` property is a local rxjs `Subscription`, often used to store the handle returned from the adapter subscription.
* The `ProposalModule` should define an `init()` function that defines relevant properties, starts relevant subscriptions, and then sets `initialized` to true. The corresponding `deinit()` function is defined by default, but may be usefully overridden.
* If a chain supports proposal creation, the `ProposalModule` should define a `createTx()` function, which uses the `createITXModalData()` function defined in the `IChainModule` to perform a proposal submission transaction. Otherwise, it should throw an Error.
* The `ProposalModule` should also define other transactions relating to governance that are not specific to a single `Proposal`.

### 4.6. Proposal Type

The abstract `Proposal` class represents a single proposal of some on-chain governance system. This `Proposal` class should be implemented for every form of on-chain governance supported by a new chain, one for each `ProposalAdapter`.

* The `Proposal` class is typically implemented alongside the `ProposalAdapter`.
* The `Proposal` class takes several type arguments:
  * The `ApiT`, `ConstructorT`, and `UpdateT` correspond to the `ApiT`, `ConstructionT`, and `StateT` defined in the [adapter](#3-adapters) section.
  * `C` should be the chain's `Coin` type.
  * `VoteT` should be an `IVote` type representing a vote on the proposal.
    * `IVote` as interface only requires an `account` property.
    * `IVote` should be extended with whatever properties are necessary for a vote, such as `balance`, `choice`, etc.
    * Several pre-built extensions already exist in `models.ts`, such as `BinaryVote` and `DepositVote`.
* The `Proposal` class always contains the following properties:
  * `data` should be a `ConstructorT`, representing the immutable data used to initialize the `Proposal`.
  * `identifier` should be the unique ID of the `Proposal`, distinguishing it from all others of the same type.
  * `slug` should be the "short name" of the proposal type, as defined below in [identifiers][#identifiers].
  * `shortIdentifier` should be the short name of a `Proposal` as displayed on a card to the user.
  * `createdAt` should be the on-chain time the `Proposal` was created.
  * `title` should be the viewable title of the `Proposal`.
  * `description` should be the viewable description or body of the `Proposal`.
  * `author` should be the `Account` responsible for creating the `Proposal`.
  * `votingType` and `votingUnit` should specify the type of vote (simple yes no, approval, etc.), and whether it is 1 person or 1 coin per vote.
  * `canVoteFrom` and `canCreateFrom` should return true if the provided `Account` can vote on or can create a given type of `Proposal`.
  * `endTime` should return a `ProposalEndTime` with the kind and completion time of the `Proposal`.
  * `isPassing` should return a `ProposalStatus` corresponding to the `Proposal`'s passing state.
  * `support` should return some measure of the `Proposal`'s support, typically a percentage of yes voters relative to no.
  * `turnout` should return what percentage of the entire possible voting body has voted on the `Proposal`.
* The `Proposal` class should implement a constructor function, which typically subscribes to state updates on the `Proposal` and adds itself to the `ProposalAdapter` store.
* The `Proposal` class should also implement an `updateState` function, which handles the `UpdateT` objects resulting from state updates. The super call in this function should always come last, as it updates the `completed` field, which prevents any other field updates.
* The `Proposal` class should implement a `submitVoteTx` function using the `IChainModule`'s `createTXModalData()` function. This should take a `VoteT` as argument and send an on-chain transaction to vote on a specific `Proposal`.
  * A `Proposal`'s votes are stored in the `votes` property, which is an rxjs `BehaviorSubject` (which can be used to produce an `Observable`) containing a mapping of voters to their votes. The `addOrUpdateVote()` function may be useful for performing state updates, but these vote-related calls will likely not need to be overridden.
* Any other transactions related to a specific `Proposal` should also be implemented as methods.

## 5. App Integration

Once the controllers are completed, other changes must be made across the app to fully integrate the new chain with Commonwealth.

The most important update is, if not already done, to add the new chain to `ChainBase` (if a new type of chain) and `ChainClass` in the `client/scripts/models/models.ts` file.

### 5.1. Identifiers

In order to access the page for a particular chain or a particular proposal type, the chain must identify itself with a URL slug. Slugs are managed in the `client/scripts/identifiers.ts` file.

The following objects must be updated:
* The new proposal types must be added to the `ProposalType` enum.
* A new entry must be added to the `map` object, from the given `ProposalType` to the corresponding `ProposalAdapter` object.
* The `proposalSlugsFromChain()` function must be updated to return the valid types of proposals on the new chain.
* A new entry must be added to the `proposalSlugToFriendlyName` object that maps the URL slug to a "human readable" name.

### 5.2. Initialization

Once identifiers are present, the chain can be initialized. Most initialization takes place in the `client/scripts/app.ts` file.

* The `selectNode` function must create the corresponding `IChainAdapter` class when the corresponding network is selected, as described by the `NodeInfo` (known as `ChainNode` on the server) in its argument.

Assuming all API connection is performed in the `IChainAdapter`, this should be sufficient to permit chain initialization.

### 5.3. Views

The remaining changes required involve updating the view to support the new chain in places where it does not programmatically update.

Several regions of view code are chain-specific, often switched by a call to `app.chain.base === ChainBase.<base>`, `app.chain.class === ChainClass.<class>`, or `account instanceof <chain-Account-type>`. The main pages requiring updates are as follows:

* `client/script/views/components/header.ts`: the `Navigation` menu of the header must be specialized with items for each chain, and the `ActionMenu` must list the viable options on each chain.
* `client/scripts/views/components/widgets/account_balance.ts`: the `AccountBalance` widget must accurately reflect the balance on each chain.
* `client/scripts/views/modals/link_new_address_modal.ts`: this multi-step modal is responsible for providing an address linking flow for all chains. Any method of linking new chains via server validation, such as browser extensions and wallets, must be added to the `LinkNewAddressModal`.
  * This update in particular can be complex, as it requires navigating the steps of the modal and providing flows for using external tools.
* `client/scripts/views/modals/tx_signing_modal.ts`: this modal guides the user through transaction signing. If transactions are supported on a new chain, the new chain's signing options should be described and implemented here.
* `client/scripts/views/modals/new_proposal_modal.ts`: the specific information required to create a new proposal on the chain must be added to the `NewProposalForm`.
* `client/scripts/views/pages/proposals.ts`: the specific proposals to display from each chain must be fetched here. They will be displayed by `ProposalRow`, which is chain-agnostic.
* However, the `client/scripts/views/components/proposals/voting_actions.ts` and `client/scripts/views/components/proposals/voting_results.ts` views must both be specialized for the display of any governance modules on a new chain.
* `client/scripts/views/pages/validators/index.ts`: if validators are supported on the new chain, their style of display must be added to the `Validators` view.

Other views may also need updating (or creation from scratch!) as the need arises, but the views listed above are the most significant. Once these views are integrated with the new controller logic, your implementation is complete! Congratulations!
