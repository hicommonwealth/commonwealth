# Prediction Markets (Futarchy) Integration Plan

## Overview

Integrate the existing **Futarchy Protocol** contracts from `common-protocol` into the Commonwealth platform. Users create a thread, attach a binary prediction market (PASS/FAIL), and participants mint outcome tokens with collateral then swap between them via Uniswap V3 to express predictions. Markets resolve automatically via TWAP or manually by admin.

---

## Contract Source (common-protocol repo)

**Repo:** `hicommonwealth/common-protocol`
**Branch:** `dillchen/prediction-market`
**Commit:** `8504b0c` -- _Update the fe interface for the new deployment_
**GitHub:** `https://github.com/hicommonwealth/common-protocol/tree/dillchen/prediction-market`

### Contract File Tree

```text
common-protocol/  (branch: dillchen/prediction-market)
|
+-- src/Prediction_Market/
|   +-- BUILD.md
|   +-- core/
|   |   +-- BinaryVault.sol          # Central vault: market creation, mint/merge/redeem
|   |   +-- FutarchyGovernor.sol     # Proposal lifecycle, TWAP resolution
|   |   +-- FutarchyRouter.sol       # Swap routing to exchange strategies
|   +-- interfaces/
|   |   +-- IExchangeStrategy.sol    # Strategy interface (swap, TWAP)
|   +-- libraries/
|   |   +-- FullMathHelper.sol       # 512-bit math (from Uniswap V3)
|   |   +-- TickMathHelper.sol       # Tick/price math (from Uniswap V3)
|   +-- strategies/
|   |   +-- UniswapV3Strategy.sol    # Uniswap V3 pool for price discovery
|   +-- tokens/
|       +-- OutcomeToken.sol         # ERC20 outcome token (PASS/FAIL)
|
+-- test/Prediction_Market/
|   +-- BinaryVault.t.sol            # Vault unit tests
|   +-- FutarchyRouter.t.sol         # Router unit tests
|   +-- FutarchyProtocol.t.sol       # Integration tests (full lifecycle)
|   +-- UniswapV3Strategy.t.sol      # Strategy + TWAP tests
|   +-- README.md
|   +-- mocks/
|       +-- MockERC20.sol
|       +-- MockUniswapV3Factory.sol
|       +-- MockSwapRouter.sol
|       +-- MockPositionManager.sol
|       +-- MockUniswapHelper.sol
|
+-- script/Prediction_Market/
|   +-- DeployPredictionMarket.s.sol  # Main deployment script
|   +-- CreateProposal.s.sol         # Create proposal script
|   +-- FullFlowTest.s.sol           # End-to-end flow test
|   +-- VerifyDeployment.s.sol       # Post-deploy verification
|   +-- TestRedemption.s.sol         # Redemption test
|   +-- TestFlashloanAttack.s.sol    # Security: flashloan resistance
|   +-- TestWhaleAttack.s.sol        # Security: whale manipulation
|   +-- TestMultiBlockAttack.s.sol   # Security: multi-block attack
|   +-- TestLongTermManipulation.s.sol
|   +-- TestEndOfProposalFlash.s.sol
|   +-- MeasureGasCosts.s.sol        # Gas benchmarks
|   +-- README.md, QUICK_START.md, VOTING_GUIDE.md
|   +-- (+ setup/check scripts)
|
+-- prediction_market_helpers_frontend/
    +-- src/
        +-- index.ts                 # Barrel exports
        +-- types.ts                 # TS interfaces (Market, Proposal, SwapParams, etc.)
        +-- config.ts                # Contract addresses (Anvil, Base Sepolia)
        +-- utils.ts                 # Formatting, slippage calc, time utils
        +-- abis.ts                  # All contract ABIs (source for evm-protocols import)
        +-- PredictionMarket.ts      # Main orchestration class
        +-- BinaryVault.ts           # Vault helper (mint/merge/redeem)
        +-- FutarchyGovernor.ts      # Governor helper (propose/resolve)
        +-- FutarchyRouter.ts        # Router helper (swap)
        +-- UniswapV3Strategy.ts     # Strategy helper (TWAP)
```

---

## Architecture Diagrams

### System Overview

```text
+-----------------------------------------------------------------------------------+
|                            COMMONWEALTH PLATFORM                                  |
|                                                                                   |
|  +------------------+    +------------------+    +--------------------+            |
|  |    Frontend      |    |    tRPC API      |    |   Chain Events     |            |
|  |   (React)        |--->|   (Express)      |    |   Worker (EVM)     |            |
|  |                  |    |                  |    |                    |            |
|  |  Thread + PM     |    |  CRUD + Query    |    |  Polls blocks      |            |
|  |  Card + Trade    |    |  endpoints       |    |  every 120s        |            |
|  |  Modal           |    |                  |    |                    |            |
|  +--------|---------+    +--------|----------+    +---------|----------+            |
|           |                       |                         |                      |
|           |  wallet tx            |  read/write             |  logs -> mappers     |
|           v                       v                         v                      |
|  +------------------+    +------------------+    +--------------------+            |
|  |  Contract        |    |   PostgreSQL     |<---|    Outbox Table    |            |
|  |  Helpers         |    |                  |    |   (event queue)    |            |
|  |  (evm-protocols) |    |  PredictionMkt   |    +---------|----------+            |
|  +--------|---------+    |  Trade           |              |                      |
|           |              |  Position         |              v                      |
|           |              +------------------+    +--------------------+            |
|           |                                      |   RabbitMQ         |            |
|           v                                      |   (Rascal)         |            |
|  +--------------------------------------------------|-------------------+          |
|  |                    ON-CHAIN (Base / Base Sepolia) v                  |          |
|  |                                                                     |          |
|  |  +--------------+   +----------------+   +------------------+       |          |
|  |  | BinaryVault  |   | Futarchy       |   | Futarchy         |       |          |
|  |  |              |   | Governor       |   | Router           |       |          |
|  |  | createMarket |   | propose()      |   | swap()           |       |          |
|  |  | mint()       |   | resolve()      |   |                  |       |          |
|  |  | merge()      |   | TWAP-based     |   | UniswapV3Strategy|       |          |
|  |  | redeem()     |   | auto-resolve   |   | (price discovery)|       |          |
|  |  +--------------+   +----------------+   +------------------+       |          |
|  |                                                                     |          |
|  |  +-------------+  +-------------+                                   |          |
|  |  |  pToken     |  |  fToken     |  (ERC20 outcome tokens)          |          |
|  |  |  (PASS)     |  |  (FAIL)     |                                   |          |
|  |  +-------------+  +-------------+                                   |          |
|  +---------------------------------------------------------------------+          |
+-----------------------------------------------------------------------------------+
```

### User Flow: Thread + Prediction Market

```text
  User (Thread Author)                Commonwealth                    On-Chain
  ====================                ============                    ========

  1. Create Thread
     + attach PM prompt
     |
     |--- POST createThread --------->|
     |--- POST createPredictionMkt -->| (status: draft)
     |                                |--- store in DB
     |                                |
  2. Deploy Market
     |--- wallet tx -----------------------------------------> Governor.propose()
     |                                                         |-> Vault.createMarket()
     |                                                         |-> Deploy pToken + fToken
     |                                                         |-> Create Uniswap V3 pool
     |                                                         |
     |<-- tx receipt -----------------------------------------|
     |--- POST deployPredictionMkt -->| (status: active)
     |                                |--- store addresses
     |                                |
                                      |<-- EVM worker polls ProposalCreated event
                                      |--- Outbox -> RabbitMQ -> Policy
                                      |--- verify/update DB record
```

### User Flow: Trading

```text
  Trader                     Commonwealth                     On-Chain
  ======                     ============                     ========

  1. Mint (get both tokens)
     |--- wallet tx ------------------------------------> Vault.mint(100 USDC)
     |<-- 100 pToken + 100 fToken --------------------|
     |                                                  |
     |                              EVM worker polls TokensMinted event
     |                              |--- Policy -> ProjectTrade (action: mint)
     |                              |--- update Position (p:100, f:100)

  2. Swap (express prediction)
     |--- wallet tx ------------------------------------> Router.swap(buyPass=true,
     |                                                       50 fToken)
     |<-- ~52 pToken ----------------------------------|
     |                                                  |
     |                              EVM worker polls SwapExecuted event
     |                              |--- Policy -> ProjectTrade (action: swap_buy_pass)
     |                              |--- update Position (p:152, f:50)

  3. After Resolution (PASS wins)
     |--- wallet tx ------------------------------------> Vault.redeem(152 pToken)
     |<-- 152 USDC ------------------------------------|
     |                                                  |
     |                              EVM worker polls TokensRedeemed event
     |                              |--- Policy -> ProjectTrade (action: redeem)
     |                              |--- update Position (p:0, f:50)
```

### Market Lifecycle State Machine

```text
                  create (off-chain)        deploy (on-chain tx)
     +--------+  ------------------>  +---------+  ----------------->  +----------+
     | (none) |                       |  DRAFT  |                      |  ACTIVE  |
     +--------+                       +---------+                      +----+-----+
                                          |                                 |
                                          | cancel                          | time passes,
                                          v                                 | users trade
                                     +-----------+                          |
                                     | CANCELLED |          +---------------+
                                     +-----------+          |
                                                            | resolve() called
                                                            | (TWAP >= 55% -> PASS)
                                                            | (TWAP <  55% -> FAIL)
                                                            v
                                                       +----------+
                                                       | RESOLVED |
                                                       | winner=1 | (PASS)
                                                       | winner=2 | (FAIL)
                                                       +----------+
                                                            |
                                                            | users redeem winning tokens
                                                            v
                                                       (settled)
```

### Data Model ERD

```text
  +------------------+       +-------------------------+       +--------------------+
  |     Thread       |       |   PredictionMarket      |       |   PM_Trade         |
  |------------------|       |-------------------------|       |--------------------|
  | id          (PK) |<------| thread_id          (FK) |<------| prediction_mkt_id  |
  | has_prediction_  |  1:N  | community_id       (FK) |  1:N  | eth_chain_id  (PK) |
  |   market         |       | eth_chain_id            |       | tx_hash       (PK) |
  | ...              |       | proposal_id (bytes32)   |       | trader_address     |
  +------------------+       | market_id   (bytes32)   |       | action (enum)      |
                             | vault_address           |       | collateral_amount  |
  +------------------+       | governor_address        |       | p_token_amount     |
  |    Community     |       | router_address          |       | f_token_amount     |
  |------------------|       | strategy_address        |       | timestamp          |
  | id          (PK) |<------| p_token_address         |       +--------------------+
  | ...              |  1:N  | f_token_address         |
  +------------------+       | collateral_address      |       +--------------------+
                             | creator_address         |       |   PM_Position      |
                             | prompt                  |       |--------------------|
                             | status (enum)           |<------| prediction_mkt_id  |
                             | winner (0/1/2)          |  1:N  | user_address       |
                             | duration                |       | user_id            |
                             | resolution_threshold    |       | p_token_balance    |
                             | start_time, end_time    |       | f_token_balance    |
                             | resolved_at             |       | total_collateral_in|
                             | total_collateral        |       +--------------------+
                             | current_probability     |          UNIQUE(mkt_id,
                             +-------------------------+            user_address)
```

### Chain Events Pipeline

```text
  EVM Blockchain                     Commonwealth Backend
  ==============                     ===================

  Block N:
  +-------------------+
  | Log: SwapExecuted |     evmChainEvents worker (polls every 120s)
  | marketId: 0xabc   |     |
  | user: 0x123       |---->| 1. Fetch logs by contract + event signature
  | buyPass: true     |     | 2. Decode with BinaryVaultAbi / FutarchyRouterAbi
  | amountIn: 50e18   |     | 3. predictionMarketSwapMapper() transforms log
  | amountOut: 52e18  |     |        |
  +-------------------+     |        v
                            | 4. Outbox.create({ event_name, event_payload })
                            |        |
                            | 5. relayForever() reads Outbox
                            |        |
                            |        v
                            | 6. RabbitMQ publish (Rascal)
                            |        |
                            |        v
                            | 7. PredictionMarketPolicy subscribes
                            |    body.PredictionMarketSwapExecuted:
                            |        |
                            |        v
                            | 8. command(ProjectPredictionMarketTrade, payload)
                            |    -> INSERT PredictionMarketTrade
                            |    -> UPSERT PredictionMarketPosition
                            |    -> UPDATE PredictionMarket.current_probability
```

---

## Engineering Tickets

### TICKET PM-1: Zod Schemas + Context

**Size:** S | **Depends on:** nothing | **Blocks:** PM-2, PM-3

Create Zod schemas for PredictionMarket entities, commands, and queries.

**Files to create:**

- `libs/schemas/src/entities/prediction-market.schemas.ts`
- `libs/schemas/src/entities/prediction-market-trade.schemas.ts`
- `libs/schemas/src/entities/prediction-market-position.schemas.ts`
- `libs/schemas/src/commands/prediction-market.schemas.ts`
- `libs/schemas/src/queries/prediction-market.schemas.ts`

**Files to modify:**

- `libs/schemas/src/entities/index.ts`
- `libs/schemas/src/commands/index.ts`
- `libs/schemas/src/queries/index.ts`
- `libs/schemas/src/context.ts` (add `PredictionMarketContext`)

**Acceptance criteria:**

- [ ] `PredictionMarket` entity schema has all fields (see Data Model ERD above)
- [ ] `PredictionMarketTrade` entity has composite key (eth_chain_id, transaction_hash)
- [ ] `PredictionMarketPosition` entity has unique constraint schema (prediction_market_id, user_address)
- [ ] `CreatePredictionMarket` command has ThreadContext, accepts prompt/collateral/duration/threshold/initial_liquidity
- [ ] `DeployPredictionMarket` command accepts all on-chain addresses
- [ ] `ResolvePredictionMarket`, `CancelPredictionMarket` commands defined
- [ ] `ProjectPredictionMarketTrade` + `ProjectPredictionMarketResolution` system commands defined
- [ ] 3 query schemas defined (GetPredictionMarkets, GetTrades, GetPositions)
- [ ] `PredictionMarketContext` added to context.ts
- [ ] All schemas exported from barrel files
- [ ] `pnpm -r check-types` passes

**Tests:**

- Schema validation tests: valid/invalid inputs for each command schema
- Enum validation: status must be one of [draft, active, resolved, cancelled]
- Action enum validation: must be one of [mint, merge, swap_buy_pass, swap_buy_fail, redeem]

---

### TICKET PM-2: Sequelize Models + Migration

**Size:** M | **Depends on:** PM-1 | **Blocks:** PM-3, PM-4

Create Sequelize models and database migration for prediction market tables.

**Files to create:**

- `libs/model/src/models/prediction_market.ts`
- `libs/model/src/models/prediction_market_trade.ts`
- `libs/model/src/models/prediction_market_position.ts`
- `libs/model/migrations/YYYYMMDDHHMMSS-create-prediction-markets.js`

**Files to modify:**

- `libs/model/src/models/factories.ts` (register 3 models)
- `libs/model/src/models/index.ts` (export types)
- `libs/model/src/models/associations.ts` (add relationships)
- `libs/model/src/models/thread.ts` (add `has_prediction_market` column)

**Acceptance criteria:**

- [ ] `PredictionMarkets` table created with correct column types (DECIMAL(78,0) for amounts)
- [ ] `PredictionMarketTrades` table with composite PK (eth_chain_id, transaction_hash)
- [ ] `PredictionMarketPositions` table with UNIQUE constraint (prediction_market_id, user_address)
- [ ] `Threads` table has new `has_prediction_market` BOOLEAN column
- [ ] Associations: Community->PM (1:N), Thread->PM (1:N), PM->Trade (1:N), PM->Position (1:N)
- [ ] All foreign keys have ON DELETE behavior defined
- [ ] Indexes on: thread_id, community_id, market_id, status, vault_address, trader_address
- [ ] Migration runs cleanly: `pnpm migrate-db`
- [ ] Migration rolls back cleanly
- [ ] `pnpm -r check-types` passes

**Tests:**

- Model creation: can create PredictionMarket with all required fields
- Association tests: PM belongs to Thread, PM has many Trades, PM has many Positions
- Unique constraint: duplicate (prediction_market_id, user_address) in Position throws
- Composite PK: duplicate (eth_chain_id, tx_hash) in Trade throws

---

### TICKET PM-3: Backend Aggregates (Commands + Queries)

**Size:** L | **Depends on:** PM-1, PM-2 | **Blocks:** PM-4, PM-7

Implement business logic commands and queries following existing aggregate patterns.

**Files to create (in `libs/model/src/aggregates/prediction-market/`):**

- `CreatePredictionMarket.command.ts`
- `DeployPredictionMarket.command.ts`
- `ResolvePredictionMarket.command.ts`
- `CancelPredictionMarket.command.ts`
- `ProjectPredictionMarketTrade.command.ts`
- `ProjectPredictionMarketResolution.command.ts`
- `GetPredictionMarkets.query.ts`
- `GetPredictionMarketTrades.query.ts`
- `GetPredictionMarketPositions.query.ts`
- `index.ts`

**Files to modify:**

- `libs/model/src/index.ts` (export aggregate)
- `libs/model/src/middleware/auth.ts` (add `authPredictionMarket()`)

**Acceptance criteria:**

- [ ] `CreatePredictionMarket`: requires ThreadContext auth (thread author), creates PM + sets thread.has_prediction_market=true in transaction
- [ ] `DeployPredictionMarket`: updates PM with on-chain addresses, sets status=active, records start_time/end_time
- [ ] `ResolvePredictionMarket`: only thread author or admin, validates market is active, sets winner
- [ ] `CancelPredictionMarket`: only thread author or admin, validates market is draft/active
- [ ] `ProjectPredictionMarketTrade`: system command, creates Trade record, upserts Position (updates balances based on action type), updates total_collateral
- [ ] `ProjectPredictionMarketResolution`: system command, updates status=resolved, sets winner + resolved_at
- [ ] `GetPredictionMarkets`: returns markets for thread_id with eager-loaded positions
- [ ] `GetPredictionMarketTrades`: returns paginated trades for a market
- [ ] `GetPredictionMarketPositions`: returns all positions for a market
- [ ] `authPredictionMarket()` middleware validates actor permissions
- [ ] All commands use transactions where needed
- [ ] `pnpm -r check-types` passes

**Tests:**

- CreatePredictionMarket: success, non-author rejected, duplicate on thread
- DeployPredictionMarket: success, invalid status transition (cancelled -> active rejected)
- ResolvePredictionMarket: success, non-author non-admin rejected, already resolved rejected
- CancelPredictionMarket: success, already resolved rejected
- ProjectPredictionMarketTrade: mint creates position, swap updates balances, merge reduces balances, redeem reduces winning tokens
- State machine: draft->active, active->resolved, active->cancelled, draft->cancelled (only valid transitions)

---

### TICKET PM-4: tRPC API Routes + External Router

**Size:** S | **Depends on:** PM-3 | **Blocks:** PM-7, PM-8

Wire up tRPC routes for all prediction market commands and queries.

**Files to create:**

- `packages/commonwealth/server/api/prediction-market.ts`

**Files to modify:**

- `packages/commonwealth/server/api/external-router.ts`

**Acceptance criteria:**

- [ ] All 7 routes registered: createPredictionMarket, deployPredictionMarket, resolvePredictionMarket, cancelPredictionMarket, getPredictionMarkets, getPredictionMarketTrades, getPredictionMarketPositions
- [ ] Mutations have Mixpanel analytics tracking
- [ ] Routes accessible via `trpc.predictionMarket.*`
- [ ] External API routes registered in `external-router.ts`
- [ ] `pnpm -r check-types` passes

**Tests:**

- Integration tests hitting each tRPC endpoint
- Auth: unauthenticated requests rejected for mutations
- Query: getPredictionMarkets returns empty array for thread without markets
- Full CRUD flow: create -> deploy -> query -> resolve

---

### TICKET PM-5: Contract ABIs + Event Signatures + Registry

**Size:** M | **Depends on:** nothing | **Blocks:** PM-6

Import ABIs from common-protocol and register event signatures for chain event polling.

**Source:** `common-protocol/prediction_market_helpers_frontend/src/abis.ts`

**Files to create:**

- `libs/evm-protocols/src/abis/BinaryVaultAbi.ts`
- `libs/evm-protocols/src/abis/FutarchyGovernorAbi.ts`
- `libs/evm-protocols/src/abis/FutarchyRouterAbi.ts`
- `libs/evm-protocols/src/common-protocol/contractHelpers/predictionMarket.ts`

**Files to modify:**

- `libs/evm-protocols/src/event-registry/eventSignatures.ts` (8 signatures)
- `libs/evm-protocols/src/event-registry/eventRegistry.ts` (3 contract sources)

**Acceptance criteria:**

- [ ] ABIs extracted from common-protocol helpers and formatted for Viem
- [ ] 8 event signature hashes computed and registered under `PredictionMarket` namespace
- [ ] 3 contract sources registered: binaryVaultSource (5 events), futarchyGovernorSource (2), futarchyRouterSource (1)
- [ ] Sources registered for Base, Base Sepolia, and Anvil chain IDs
- [ ] Contract helpers wrap: createProposal, mintTokens, mergeTokens, swapTokens, resolveProposal, redeemTokens, getCurrentProbability, getMarketInfo
- [ ] `pnpm -r check-types` passes

**Tests:**

- Verify event signature hashes match actual keccak256 of Solidity event signatures
- Contract helper unit tests with mocked providers

---

### TICKET PM-6: Outbox Events + Event Mappers + Policy

**Size:** L | **Depends on:** PM-2, PM-3, PM-5 | **Blocks:** PM-9

Full chain events pipeline: event schemas, mappers, and consumer policy.

**Files to create:**

- `libs/model/src/policies/PredictionMarket.policy.ts`

**Files to modify:**

- `libs/schemas/src/events/events.schemas.ts` (8 new event types)
- `libs/model/src/services/evmChainEvents/chain-event-utils.ts` (8 mappers)
- `packages/commonwealth/server/bindings/rascalConsumerMap.ts` (register policy)
- `libs/model/src/index.ts` (export policy)

**Acceptance criteria:**

- [ ] 8 event schemas defined in events.schemas.ts matching contract event parameters
- [ ] 8 mapper functions decode raw EVM logs using ABIs and produce typed event payloads
- [ ] All mappers registered in `chainEventMappers` keyed by event signature hash
- [ ] `PredictionMarketPolicy` handles all 8 events:
  - ProposalCreated -> link on-chain addresses to DB record
  - SwapExecuted -> ProjectPredictionMarketTrade (swap_buy_pass/swap_buy_fail)
  - TokensMinted -> ProjectPredictionMarketTrade (mint)
  - TokensMerged -> ProjectPredictionMarketTrade (merge)
  - TokensRedeemed -> ProjectPredictionMarketTrade (redeem)
  - MarketResolved -> ProjectPredictionMarketResolution
  - ProposalResolved -> ProjectPredictionMarketResolution
  - MarketCreated -> verify/link market record
- [ ] Policy registered in rascalConsumerMap
- [ ] `pnpm -r check-types` passes

**Tests:**

- Mapper tests: raw log hex -> decoded event payload (for each of 8 events)
- Policy integration tests: mock event -> verify DB state after processing
- Idempotency: processing same event twice doesn't create duplicate trades (composite PK enforces)
- Position aggregation: mint 100 + swap 50 fToken = position(p:152, f:50)

---

### TICKET PM-7: Frontend React Query Hooks

**Size:** S | **Depends on:** PM-4 | **Blocks:** PM-8

Create React Query hooks wrapping all prediction market tRPC endpoints.

**Files to create (in `client/scripts/state/api/prediction-markets/`):**

- `index.ts`
- `createPredictionMarket.ts`
- `deployPredictionMarket.ts`
- `resolvePredictionMarket.ts`
- `getPredictionMarkets.ts`
- `getPredictionMarketTrades.ts`
- `getPredictionMarketPositions.ts`

**Acceptance criteria:**

- [ ] `useCreatePredictionMarketMutation` wraps trpc.predictionMarket.createPredictionMarket
- [ ] `useDeployPredictionMarketMutation` wraps deploy endpoint
- [ ] `useResolvePredictionMarketMutation` wraps resolve endpoint
- [ ] `useGetPredictionMarketsQuery(threadId)` fetches markets with staleTime: 30s
- [ ] `useGetPredictionMarketTradesQuery(marketId)` fetches trade history
- [ ] `useGetPredictionMarketPositionsQuery(marketId)` fetches positions
- [ ] All mutations invalidate relevant queries on success
- [ ] `pnpm -r check-types` passes

**Tests:**

- Hook renders without error (React Testing Library)
- Mutation success invalidates cache

---

### TICKET PM-8: Frontend Components + Thread Integration

**Size:** XL | **Depends on:** PM-7 | **Blocks:** PM-9

Build all prediction market UI components and integrate into thread creation/view.

**Files to create:**

- `client/scripts/views/pages/view_thread/ThreadPredictionMarketCard.tsx`
- `client/scripts/views/pages/view_thread/ThreadPredictionMarketEditorCard.tsx`
- `client/scripts/views/modals/prediction_market_editor_modal.tsx`
- `client/scripts/views/modals/prediction_market_trade_modal.tsx`
- `client/scripts/views/modals/prediction_market_resolve_modal.tsx`
- `client/scripts/views/pages/view_thread/prediction_market_cards.scss`
- `client/scripts/utils/prediction-markets.ts`

**Files to modify:**

- `client/scripts/views/components/NewThreadForm/NewThreadForm.tsx`
- `client/scripts/views/pages/view_thread/ViewThreadPage.tsx`

**Sub-tickets:**

#### PM-8a: ThreadPredictionMarketCard

Display component showing market state, probability, positions, and action buttons.

**Acceptance criteria:**

- [ ] Shows market prompt as card header
- [ ] Probability bar: green (PASS) / red (FAIL) proportional fill
- [ ] Displays user's pToken + fToken balances if connected
- [ ] Action buttons: Mint, Swap to PASS, Swap to FAIL, Merge (when active)
- [ ] Redeem button visible when resolved + user has winning tokens
- [ ] Status badge: DRAFT (gray), ACTIVE (blue), RESOLVED (green/red), CANCELLED (gray)
- [ ] Shows total collateral locked and time remaining
- [ ] Cancel button for thread author (draft/active only)
- [ ] Responsive layout, matches CW design system
- [ ] Skeleton loading state

#### PM-8b: Editor Modal (Creation)

Form for configuring a new prediction market.

**Acceptance criteria:**

- [ ] Text input for prompt/question
- [ ] Collateral token selector (USDC, WETH, custom ERC20 address input)
- [ ] Duration picker (1-90 days)
- [ ] Resolution threshold slider (default 55%, range 51-99%)
- [ ] Initial liquidity amount input with token balance check
- [ ] Chain selector (Base, Base Sepolia)
- [ ] Validation: all fields required, liquidity > 0, valid addresses
- [ ] "Create and Deploy" button: creates DB record, then triggers wallet tx, then records deployment
- [ ] Loading states during wallet interaction
- [ ] Error handling for rejected/failed transactions

#### PM-8c: Trade Modal

Trading interface with Mint/Swap/Merge/Redeem tabs.

**Acceptance criteria:**

- [ ] **Mint tab:** amount input, shows collateral cost, "Deposit and Mint" button
- [ ] **Swap tab:** buy PASS/FAIL toggle, amount input, slippage setting (default 1%), estimated output, "Swap" button
- [ ] **Merge tab:** amount input (limited to min of pToken/fToken balance), shows collateral returned, "Merge" button
- [ ] **Redeem tab:** (only post-resolution) amount input, shows collateral returned, "Redeem" button
- [ ] All tabs show current token balances
- [ ] All tabs trigger wallet tx via contract helpers
- [ ] Loading/success/error states for each operation
- [ ] Tabs disabled based on market status (swap disabled when resolved, redeem disabled when active)

#### PM-8d: Resolve Modal

Admin resolution interface.

**Acceptance criteria:**

- [ ] Shows current TWAP probability percentage
- [ ] TWAP window selector (default 1hr)
- [ ] Shows predicted outcome based on threshold
- [ ] "Resolve Market" button triggers FutarchyGovernor.resolve() on-chain
- [ ] Only visible to thread author / community admin
- [ ] Only enabled when market end_time has passed

#### PM-8e: Thread Integration

Wire prediction market into thread creation and view flows.

**Acceptance criteria:**

- [ ] NewThreadForm: "Prediction Market" button in sidebar opens editor modal
- [ ] NewThreadForm: local prediction market state persisted during thread creation
- [ ] NewThreadForm: prediction market created after successful thread creation
- [ ] ViewThreadPage: ThreadPredictionMarketCard rendered in sidebar when thread.has_prediction_market=true
- [ ] ViewThreadPage: predictions load via useGetPredictionMarketsQuery

---

### TICKET PM-9: Feature Flag + Community Setting

**Size:** S | **Depends on:** PM-8 | **Blocks:** nothing

Gate the feature behind a feature flag for controlled rollout.

**Files to modify:**

- Feature flag configuration (add `FLAG_PREDICTION_MARKETS`)
- Frontend: wrap all PM UI behind `useFlag('prediction_markets')`
- NewThreadForm: hide "Prediction Market" button when flag is off
- ViewThreadPage: hide PM card when flag is off

**Acceptance criteria:**

- [ ] Feature flag `FLAG_PREDICTION_MARKETS` defined
- [ ] All prediction market UI hidden when flag is off
- [ ] API routes still functional (flag only gates UI)
- [ ] Flag can be toggled per environment

---

### TICKET PM-10: Testing + QA

**Size:** L | **Depends on:** PM-1 through PM-9 | **Blocks:** nothing

Comprehensive testing across all layers.

**Files to create:**

- `libs/model/test/prediction-market/CreatePredictionMarket.spec.ts`
- `libs/model/test/prediction-market/ProjectTrade.spec.ts`
- `libs/model/test/prediction-market/Resolution.spec.ts`
- `packages/commonwealth/test/integration/api/prediction-markets.spec.ts`
- `packages/commonwealth/test/integration/chain-events/prediction-market-events.spec.ts`

See detailed test plan below.

---

## Dependency Graph

```text
  PM-1 (Schemas)
    |
    +-------> PM-2 (Models + Migration)
    |            |
    |            +-------> PM-3 (Aggregates)
    |                        |
    |                        +-------> PM-4 (tRPC Routes)
    |                        |            |
    |                        |            +-------> PM-7 (React Query Hooks)
    |                        |                        |
    |                        |                        +-------> PM-8 (Frontend Components)
    |                        |                                     |
    |                        +-------> PM-6 (Chain Events)         +-------> PM-9 (Feature Flag)
    |                             ^                                |
    |                             |                                +-------> PM-10 (Testing)
    +-------> PM-5 (ABIs + Sigs)-+
```

**Parallelizable work:**

- PM-1 + PM-5 can start simultaneously (no dependencies)
- PM-2 starts after PM-1
- PM-5 has no backend dependencies (pure contract/ABI work)
- PM-7 and PM-6 can run in parallel after PM-3/PM-4

---

## Detailed Test Plan

### Unit Tests

| Test | File | What it validates |
|------|------|-------------------|
| Schema validation | `libs/model/test/prediction-market/schemas.spec.ts` | Zod schemas accept valid input, reject invalid |
| CreatePredictionMarket | `libs/model/test/prediction-market/CreatePredictionMarket.spec.ts` | Creates record, sets thread flag, auth checks |
| DeployPredictionMarket | same dir | Updates addresses, status transition draft->active |
| ResolvePredictionMarket | same dir | Sets winner, status transition active->resolved |
| CancelPredictionMarket | same dir | Status transition, auth checks |
| ProjectTrade - mint | `libs/model/test/prediction-market/ProjectTrade.spec.ts` | Creates trade + position with both token balances |
| ProjectTrade - swap | same | Updates position, changes token balances |
| ProjectTrade - merge | same | Reduces both token balances, returns collateral |
| ProjectTrade - redeem | same | Reduces winning token balance |
| State machine | `libs/model/test/prediction-market/Resolution.spec.ts` | Only valid transitions allowed |
| Event mappers | `libs/model/test/prediction-market/EventMappers.spec.ts` | Raw hex logs decoded to typed payloads |
| Policy handlers | `libs/model/test/prediction-market/Policy.spec.ts` | Events -> correct commands dispatched |

### Integration Tests

| Test | File | What it validates |
|------|------|-------------------|
| API CRUD | `test/integration/api/prediction-markets.spec.ts` | Full lifecycle via tRPC: create->deploy->query->resolve |
| Auth enforcement | same | Non-author cannot create/resolve/cancel |
| Trade projection | same | System commands correctly update DB from mock events |
| Chain event pipeline | `test/integration/chain-events/prediction-market-events.spec.ts` | Mock EVM logs -> mapper -> outbox -> policy -> DB verification |
| Idempotency | same | Duplicate events don't create duplicate records |

### E2E Tests (Base Sepolia)

| Test | What it validates |
|------|-------------------|
| Thread + PM creation | Create thread, attach prediction market, deploy on-chain |
| Mint flow | Deposit collateral, receive both tokens |
| Swap flow | Swap fToken for pToken, verify price change |
| Probability display | TWAP probability updates after swaps |
| Resolution | After end_time, resolve market, verify winner |
| Redemption | Redeem winning tokens for collateral |
| UI states | Card shows correct status/probability/balances at each step |

### Acceptance Criteria Checklist (End-to-End)

- [ ] User can create a thread and attach a prediction market
- [ ] Market deploys on-chain with BinaryVault + FutarchyGovernor + UniswapV3Strategy
- [ ] Probability bar shows 50/50 initially
- [ ] User can mint tokens by depositing collateral (USDC/WETH/ERC20)
- [ ] User can swap between PASS and FAIL tokens
- [ ] Probability updates in real-time as swaps occur
- [ ] User can merge equal amounts of both tokens back to collateral
- [ ] Market auto-resolves via TWAP after end_time
- [ ] Thread author can manually trigger resolution
- [ ] Winners can redeem tokens for collateral
- [ ] Trade history shows all mints/swaps/merges/redeems
- [ ] Position display shows accurate token balances
- [ ] Feature flag controls visibility
- [ ] Chain events worker detects and processes all 8 event types
- [ ] `pnpm -r check-types` clean
- [ ] `pnpm lint-branch-warnings` clean

---

## Implementation Phases (detailed)

### Phase 1: Data Model + Schemas + Migration

**New files:**

- `libs/schemas/src/entities/prediction-market.schemas.ts`
- `libs/schemas/src/entities/prediction-market-trade.schemas.ts`
- `libs/schemas/src/entities/prediction-market-position.schemas.ts`
- `libs/schemas/src/commands/prediction-market.schemas.ts`
- `libs/schemas/src/queries/prediction-market.schemas.ts`
- `libs/model/src/models/prediction_market.ts`
- `libs/model/src/models/prediction_market_trade.ts`
- `libs/model/src/models/prediction_market_position.ts`
- `libs/model/migrations/YYYYMMDDHHMMSS-create-prediction-markets.js`

**Modified files:**

- `libs/schemas/src/entities/index.ts`
- `libs/schemas/src/commands/index.ts`
- `libs/schemas/src/queries/index.ts`
- `libs/schemas/src/context.ts`
- `libs/schemas/src/events/events.schemas.ts`
- `libs/model/src/models/factories.ts`
- `libs/model/src/models/index.ts`
- `libs/model/src/models/associations.ts`
- `libs/model/src/models/thread.ts`

### Phase 2: Backend Aggregates + API

**New files:**

- `libs/model/src/aggregates/prediction-market/CreatePredictionMarket.command.ts`
- `libs/model/src/aggregates/prediction-market/DeployPredictionMarket.command.ts`
- `libs/model/src/aggregates/prediction-market/ResolvePredictionMarket.command.ts`
- `libs/model/src/aggregates/prediction-market/CancelPredictionMarket.command.ts`
- `libs/model/src/aggregates/prediction-market/ProjectPredictionMarketTrade.command.ts`
- `libs/model/src/aggregates/prediction-market/ProjectPredictionMarketResolution.command.ts`
- `libs/model/src/aggregates/prediction-market/GetPredictionMarkets.query.ts`
- `libs/model/src/aggregates/prediction-market/GetPredictionMarketTrades.query.ts`
- `libs/model/src/aggregates/prediction-market/GetPredictionMarketPositions.query.ts`
- `libs/model/src/aggregates/prediction-market/index.ts`
- `packages/commonwealth/server/api/prediction-market.ts`

**Modified files:**

- `libs/model/src/index.ts`
- `libs/model/src/middleware/auth.ts`
- `packages/commonwealth/server/api/external-router.ts`

### Phase 3: Chain Events Integration

**New files:**

- `libs/evm-protocols/src/abis/BinaryVaultAbi.ts`
- `libs/evm-protocols/src/abis/FutarchyGovernorAbi.ts`
- `libs/evm-protocols/src/abis/FutarchyRouterAbi.ts`
- `libs/evm-protocols/src/common-protocol/contractHelpers/predictionMarket.ts`
- `libs/model/src/policies/PredictionMarket.policy.ts`

**Modified files:**

- `libs/evm-protocols/src/event-registry/eventSignatures.ts`
- `libs/evm-protocols/src/event-registry/eventRegistry.ts`
- `libs/model/src/services/evmChainEvents/chain-event-utils.ts`
- `packages/commonwealth/server/bindings/rascalConsumerMap.ts`
- `libs/model/src/index.ts`

### Phase 4: Frontend

**New files:**

- `client/scripts/state/api/prediction-markets/` (7 files)
- `client/scripts/views/pages/view_thread/ThreadPredictionMarketCard.tsx`
- `client/scripts/views/pages/view_thread/ThreadPredictionMarketEditorCard.tsx`
- `client/scripts/views/modals/prediction_market_editor_modal.tsx`
- `client/scripts/views/modals/prediction_market_trade_modal.tsx`
- `client/scripts/views/modals/prediction_market_resolve_modal.tsx`
- `client/scripts/views/pages/view_thread/prediction_market_cards.scss`
- `client/scripts/utils/prediction-markets.ts`

**Modified files:**

- `client/scripts/views/components/NewThreadForm/NewThreadForm.tsx`
- `client/scripts/views/pages/view_thread/ViewThreadPage.tsx`
- Feature flag configuration

---

## Key Patterns to Reuse

| Pattern | Source File | Reuse For |
|---------|------------|-----------|
| Poll thread attachment | `libs/model/src/aggregates/poll/CreatePoll.command.ts` | CreatePredictionMarket command structure |
| Launchpad trade projection | `libs/model/src/policies/Launchpad.policy.ts` | PredictionMarket policy + ProjectTrade |
| LaunchpadTrade model | `libs/model/src/models/launchpad_trade.ts` | PredictionMarketTrade model (composite PK) |
| Thread token model | `libs/model/src/models/thread_token.ts` | PredictionMarket model (thread association) |
| Poll tRPC router | `packages/commonwealth/server/api/poll.ts` | PredictionMarket tRPC router |
| Poll React Query hooks | `client/scripts/state/api/polls/` | PM React Query hooks |
| ThreadPollCard | `client/scripts/views/pages/view_thread/ThreadPollCard.tsx` | ThreadPredictionMarketCard |
| Poll editor modal | `client/scripts/views/modals/poll_editor_modal.tsx` | PM editor modal |
| Event mapper pattern | `libs/model/src/services/evmChainEvents/chain-event-utils.ts` | PM event mappers |
| Event signature registration | `libs/evm-protocols/src/event-registry/eventSignatures.ts` | PM event signatures |
| Contract helpers | `libs/evm-protocols/src/common-protocol/contractHelpers/launchpad.ts` | PM contract helpers |

---

## Pre-Implementation: Project Setup

### Step 0a: Save spec to common_knowledge

- Write full spec to `common_knowledge/Prediction-Markets.md` (alongside existing `Contests.md`, `Chain-Events.md`, `Stake.md`)
- Commit to branch `dillchen/prediction-markets`

### Step 0b: Tickets (pre-cut in this spec)

The 10 tickets (PM-1 through PM-10) above are pre-cut with:

- Sizes, dependency chains, file lists
- Full acceptance criteria checklists
- Test requirements per ticket
- These can be directly copied into GitHub Issues / Linear when ready to schedule sprints

---

## Verification Plan

1. `pnpm -r check-types` -- TypeScript compilation clean
2. `pnpm lint-branch-warnings` -- lint clean
3. `pnpm migrate-db` -- migration runs without errors
4. `pnpm -F commonwealth test-unit` -- unit tests pass
5. `pnpm -F commonwealth test-integration` -- integration tests pass
6. Manual: create thread + prediction market on Base Sepolia
7. Manual: mint/swap/merge/resolve/redeem full lifecycle
8. Manual: verify chain events worker picks up all 8 event types
