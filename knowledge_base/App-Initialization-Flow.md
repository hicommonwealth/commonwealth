# App Initialization Flow

The goal of this document is to describe the current state of the app initialization flow in as much detail as possible, so that we are better informed when engineering improvements.

1. On `pnpm start`, bundling begins with the `webpack.base.config.js`-defined entry point, currently set to the `client/scripts` file `index.tsx`.
2. `index.tsx` uses the browser's `root` element as a container to render the `App` view component (imported from `app.tsx`) within.
3. The `App` component fires the `useInitApp()` hook (`hooks/useInitApp.tsx`), which:
    1. Sets the `isLoading` and `customDomain` state variables, as well as initializing their respective setter functions.
    2. Queries `/domain`, setting the `customDomain` state variable with the query's response.
    3. Returns the local variables `customDomain` and `isLoading`, which are used to define their respective equivalents in `useInitApp()`.
4. `initAppState()` (`state/index.ts`) receives a `customDomain` argument from `useInitApp()`, and hits our `/status` endpoint.
    1. The `app` state variable is defined within `state/index.ts`, and its values are updated by the `initAppState`, using the `data` object returned by the `/status` route.
        - More broadly, `initAppState()` is called on:app initialization, user sign-in, user logout, and chain community creation.
    2. When the `/status` fetch is finished, app `isLoading` state is set to false.
5. The `/status` endpoint is divided into two main data-fetches, `getChainStatus()` and `getUserStatus()`. `getChainStatus()` is always called; `getUserStatus()` is only called if a `user` object has been passed with the request.
    1. `getChainStatus()`: Grabs ChainStore, ChainNodes, NotificationCategories, and CommunitySnapshotSpaces, and threadCountQueryData entries.
    2. `getUserStatus`: Grabs user associations (e.g. selected chain instance, addresses). Once addresses have been grabbed, various rows associated with those addresses (e.g. discussion drafts, roles) are requested in turn.
6. Once the `/status` data is received on callback, `initAppState()` clears and repopulates app state.
    1. Relevant controllers (e.g. user, config) are cleared.
    2. Nodes, recent activity, snapshot chains, roles, chain categories, notification categories, and notification category types are all repopulated.
    3. Active user and sign-in state are updated.
        - The websocket connection is initialized or disconnected depending on whether the user is logged in or out, respectively.
        - Sets the users’ starred communities, selected chain, and display name
    4. If a custom domain is passed as an argument to the invocation of `initAppState`, the `setCustomDomain` setter is fired. If the function's `shouldRedraw` param is set to true, then the app's `loginStateEmitter` emits a redraw.
7. A `Router` component within the `App` component conditionally renders if state variable `isLoading` is false; this router uses `react-router-dom` library methods to conditionally create either custom domain routes, or common domain routes, depending on whether a custom domain param is passed.
    1. All routes are configured in the `client/scripts/navigation` directory.
    2. `CommonDomainRoutes.tsx` and `CustomDomainRoutes.tsx` declare the routes to front-end pages, switched in `navigation/Router.tsx` based on results of the `/domain` call.
    3. "General routes," referring to pages like `/privacy` and `/terms`, are also loaded via `GeneralRoutes.tsx`.
8. Most of these routes are set to return their relevant views wrapped inside our `LayoutWrapper` component, via the function `withLayout()`, imported from `client/scripts/views/Layout.tsx`.
    1. The `LayoutWrapper` injects the page’s specific params into the page as child, and injects the `scope` argument into the `Layout` component.
    2. This `Layout` component includes a nested `Suspense` component (via the `react` library) and `ErrorBoundary` component (via the `react-error-boundary` library).
    3. The `LayoutComponent` operates as follows:
        1. If, _at render time_, `app.loadingError` is set, display an application error.
        2. If, _at render time_, the `app.loginStatusLoaded()` method returns false, a loading spinner is shown, triggered by `shouldShowLoadingState`.
        3. If, _at render time_, `app.config.chains.getById(scope)` does not return successfully, render a `PageNotFound` view.
        4. If, _at render time_, there is no `selectedScope`, and no custom domain, then whatever chain is currently being loaded is deinitialized by `deinitChainOrCommunity`, and the `ScopeToLoad` state variable set to `null`. A loading spinner is shown, triggered by `shouldShowLoadingState`.
        5. If, _at render time_, the `selectedScope` differs from `app.activeChainId()`, the `isLoading` and `scopeToLoad` global state variables are updated (to `true` and `selectedScope`, respectively). `selectChain()` is fired, receiving new scope's chain as argument; on completion, the `isLoading` state variable is set to `false`.
        6. If none of these conditions apply, the routed-to page is rendered.
9. If `selectChain()` (`/helpers/chain.ts`) is fired, per step #8:
    1. If no `chain` argument is passed, the function defaults to a `chain` value set my `app.user.selectedChain`, or else `app.config.defaultChain`.
    2. If we do not need to initialize a new chain (i.e. the chain we are switching to has already been initialized and selected), exit the function immediately.
    3. Globally deinit other active communities via `deinitChainOrCommunity`.
        - This method triggers a cascade of “deinit” calls, which set various statuses to false, destroy connections to blockchain endpoints, and eentually sets `app.chain` to `null`.
    4. Thus begins the massive if/then statement determining which chain adapter (controller for chain-specific functionality, i.e. `IChainAdapter`) to lazily import. This relies on `ChainBase`, `Network`, and `ChainType` args from the status route’s `ChainInfo` object.
        - If ChainBase is Substrate, import the Substrate adapter.
        - If ChainBase is Cosmos, import the Cosmos adapter.
        - If Network is Ethereum, import the (ETH) tokenAdapter.
        - If Network is NEAR or NEARTestnet, import the NEAR adapter.
        - If Network is Sputnik, import the Sputnik adapter (NEAR + gov).
        - If Network is Compound, import the Compound adapter (ETH).
        - If Network is Aave, import the Aave adapter (ETH).
        - If Network is ERC20, import the (ETH) tokenAdapter.
        - If Network is ERC721, import the (ETH) NftAdapter.
        - If Network is SPL, import the Solana adapter.
        - If ChainBase is Solana, import the Solana adapter.
        - If ChainBase is Ethereum and ChainType is Offchain, import the “generic” Ethereum adapter.
        - Otherwise, throw an “invalid chain” error.
    5. `initServer()` is called the returned `IChainAdapter` instance, which clears local storage and makes a call to `/bulkOffchain`, whose data is used to initialize community content.
    6. Dark mode preferences are set, and forum data (e.g. threads, admins, banners, recent activity) is populated. The `app.chain` state variable is set globally to the now-server-initialized `IChainAdapter` instance.
    7. If the `initChain` argument is `true` (e.g. in the case of NEAR communities), we then proceed to `initChain()`.
        1. If `selectChain` has not been called, or if chain is already loaded, immediately exit the function.
        2. If the chain's API is not initialized, `app.chain.initApi()` is fired.
            - This triggers chain-specific setup of communication with the blockchain endpoint, defined in e.g. controllers/chain/cosmos/adapter.ts. Often this initializes the “chain” (holds the core functionality and chain connections) and “accounts” modules (deals with user-specific logic, rarely used now), but it specifically does not initialize governance modules.
        3. If the chain's data is not loaded, `app.chain.initData()` is fired.
            - This call triggers chain-specific setup of governance data in particular. It will (generally, as part of chain-specific setup) also call `activeAddressHasToken` which hits `/tokenBalance` for the logged-in user. It also emits `ready` from the `chainModuleReady` event emitter.
        4. Emit `ready` from the `chainAdapterReady` event emitter, and print `CHAIN started.` from the console.
    8. If the user is logged in, his addresses for the initialized community are set as his current active addresses, and the `/selectCommunity` endpoint is hit, to update his last visited community.
10. Nested within the `Layout` component, the `Sublayout` component renders the header, sidebar, banners, and similar sub-components, as well as wrapping any child content pages.

## Change Log

- 230810: Authored by Graham Johnson (#4763).
