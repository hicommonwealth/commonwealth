_Current as of 4/26/23_

## Purpose

The goal of this document is to describe the current state of the site initialization flow in as much detail as possible, so we can fully understand what the requirements are before planning a solution.

A non-goal of this document is to provide a solution to improving our init flow.


## Code Audit


#### App – app.tsx



* App.tsx is the root entrypoint (rendered in `index.tsx` which is defined as entrypoint in `webpack.base.config.js`). It immediately calls `useInitApp()` (`hooks/useInitApp.tsx`) which:
    * Queries `/domain` and sets whether or not we are on a custom domain.
    * Calls `initAppState()` (`state.ts`), which calls `/status` and updates a lot of application config including user login state. Emits `redraw` on `loginStateEmitter` if login state changes.
* `commonDomainRoutes.tsx` and `customDomainRoutes.tsx` declare the routes to front-end pages, switched in `navigation/router.tsx` based on results of `/domain` call.


#### Layout – views/layout.tsx



* Each route in the router is wrapped in `withLayout`, from layout.tsx, which adds an ErrorBoundary, Suspense, and the LayoutWrapper component as parent for each route’s specific page.
* The LayoutWrapper injects the page’s specific params into the page as child, and injects the following arguments into the Layout component: `scope` and `deferChain`.
* The LayoutComponent is a `ClassComponent` that operates as follows (note there is some dead code related to the user survey popup that should be removed, as it is superseded by the “growl” component):
1. If `app.loadingError` is set _at render time_, display an application error.
2. If, _at render time_, the `app.loginState !== LoginState.NotLoaded` via the `app.loginStatusLoaded()` method is false, render a LoadingLayout.
3. If the provided scope _is an Ethereum address_, set call `initNewTokenChain` and generate a new community for the provided address, while rendering a LoadingLayout.
4. If `app.config.chains.getById(scope)` does not return successfully _at render time_, render a PageNotFound.
5. If `scope` is different from `app.activeChainId()` _at render time_ (and we are not loading another community at the same time, via `this.loadingScope`), set `this.loadingScope` to the provided scope, and then call `selectChain`, passing `deferChain` through. If `deferChain` is false once `selectChain` returns, call `initChain`. Render a `LoadingLayout` immediately (before `selectChain` resolves).
6. If `deferChain` is false on the page we’re routing to, but we have loaded with `this.deferred` true (from step 5), then call `initChain` and render a `LoadingLayout` immediately.
7. If `scope` is not defined (and we are not on a custom domain), deinitialize whatever chain is loaded by calling `deinitChainOrCommunity`, then set `loadingScope` to null. Render a `LoadingLayout` immediately.
8. If none of these conditions pass, then render the child within a div.
* Condensing the above steps into human-readable logic:
1. If initApp threw an error, show an error page.
2. If initApp hasn’t finished loading yet, show a loading page.
3. If the user has navigated to an ethereum address directly, init a new token chain immediately (feature – to reconsider whether we want to continue supporting it).
4. If the user has attempted to a community page that was not found on the list of communities from `/status`, show a 404 page.
5. If the user lands on a community-scoped page for the first time, trigger community-specific initialization (`selectChain`). If the page requires chain-specific data, trigger chain-specific initialization (`initChain`) after community loading completes.
6. If the user lands on a page in an already-initialized community that requires chain-specific initialization (and the chain-specific initialization has not already been performed), trigger chain-specific initialization.
7. If the user lands on a page outside of the community they were browsing in, deinit the community.
8. Otherwise, render the inner page as passed by router.


#### selectChain() – helpers.chain.ts

How does **<code>selectChain</code></strong> = the community-specific initialization flow work?



    * Only called as part of the Layout flow, either directly or during `initNewTokenChain`.
    * `selectChain` takes an optional `chain` argument containing the data from `/status` about the community, and a `deferred` boolean, referring to `deferChain` from the status route, defaulting to `false`.
1. Some handling for calling `selectChain` without providing the first `chain` argument. This is very likely dead code.
2. If we do not need to initialize a new chain, exit immediately (`app.chain && chain === app.chain.meta`).
3. Globally deinit other active communities via `deinitChainOrCommunity`.
4. Thus begins the massive if/then statement determining which chain adapter (controller for chain-specific functionality, i.e. `IChainAdapter`) to lazily import. This relies on `ChainBase`, `Network`, and `ChainType` args from the status route’s `ChainInfo` object.
    1. If ChainBase is Substrate import the Substrate adapter.
    2. If ChainBase is Cosmos, import the Cosmos adapter.
    3. If Network is Ethereum, import the (ETH) tokenAdapter.
    4. If Network is NEAR or NEARTestnet, import the NEAR adapter.
    5. If Network is Sputnik, import the Sputnik adapter (NEAR + gov).
    6. If Network is Compound, import the Compound adapter (ETH).
    7. If Network is Aave, import the Aave adapter (ETH).
    8. If Network is ERC20 or Axie Infinity, import the (ETH) tokenAdapter.
    9. If Network is ERC721, import the (ETH) NftAdapter.
    10. If Network is SPL, import the Solana adapter.
    11. If ChainBase is Solana, import the Solana adapter.
    12. If ChainBase is Ethereum and ChainType is Offchain, import the “generic” Ethereum adapter.
    13. Otherwise, throw “invalid chain”.
5. Call `initServer()` on the returned `IChainAdapter` which triggers a refresh of the entities adapter (i.e. `/entities` and `/getEntityMeta`), and a call to `/bulkOffchain` which is used to initialize community content.
6. Set `app.chain` globally to the now-server-initialized `IChainAdapter`.
7. If logged in: set the user’s addresses for the initialized community, and call `/selectChain` to update their last visited community.
8. Return true, as init was successful.


#### initChain() – helpers/chain.ts

In some cases (i.e. if `deferChain` is false), we then proceed to **<code>initChain</code></strong>. How does it work?



* Return immediately if `selectChain` has not been called, or if chain is already loaded (`!app.chain || !app.chain.meta || app.chain.loaded`).
* If API is not initialized, call `app.chain.initApi()`
    * This triggers chain-specific setup of communication with the blockchain endpoint, defined in e.g. controllers/chain/cosmos/adapter.ts. Often this initializes the “chain” (holds the core functionality and chain connections) and “accounts” modules (deals with user-specific logic, rarely used now), but it specifically does not initialize governance modules.
* Call `app.chain.initData()`
    * This call triggers chain-specific setup of governance data in particular. It will (generally, as part of chain-specific setup) also call `activeAddressHasToken` which hits `/tokenBalance` for the logged in user.
    * Emits `ready` from `chainModuleReady` event emitter.
* Emit `ready` from the `chainAdapterReady` event emitter, and print `CHAIN started.` In the console.


#### Page specific initialization

Most important case here is the Sublayout component, which renders the header, sidebar, banners, etc, and wraps many content pages. But init methods from here on out are specific to the Component wrapped by the Layout.


#### deinitChainOrCommunity() - helpers/chain.ts

Triggers a cascade of “deinit” calls, which set various statuses to false, destroy connections to blockchain endpoints, etc. Eventually sets `app.chain = null`.


## Route Loading Audit


#### Logged Out on /discussions (osmosis, ETH starter community)



1. /domain (check custom domain)
2. /status (load main site data)
3. /entities
4. /getEntityMeta
5. /bulkOffchain
6. /activeThreads (threads per topic = 3 => overview page)
7. /threadsUsersCountAndAvatars
8. /bulkThreads
9. /entities (looks like duplicate call?)
10. /bulkThreads (looks like duplicate call?)
11. /entities (looks like duplicate call?)
12. /reactionCounts
13. /threadsUsersCountAndAvatars
14. /reactionCounts (looks like duplicate call?)
15. /threadsUsersCountAndAvatars (looks like duplicate call?)
16. /getAddressProfile (happens sometime after step 7, may be several)


#### /overview logged out



1. /domain
2. /status
3. /entities
4. /getEntityMeta
5. /bulkOffchain
6. /activeThreads
7. /threadsUsersCountAndAvatars
8. /getAddressProfile


#### Logged In on /discussions or /overview

After step (2) above, makes the following additional calls:



1. /viewDiscussionNotifications
2. /viewChainEventNotifications
3. /viewSubscriptions
4. /getSubscribedChains

After step (7) above, makes the following additional calls:



1. /tokenBalance
2. /selectChain


#### /discussions On dYdX

Makes several IPFS calls at end of query (aave proposal naming).
