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
                                      |--- Outbox -> RabbitMQ -> Projection
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
     |                              |--- Projection -> INSERT Trade (action: mint)
     |                              |--- UPSERT Position (p:100, f:100)

  2. Swap (express prediction)
     |--- wallet tx ------------------------------------> Router.swap(buyPass=true,
     |                                                       50 fToken)
     |<-- ~52 pToken ----------------------------------|
     |                                                  |
     |                              EVM worker polls SwapExecuted event
     |                              |--- Projection -> INSERT Trade (action: swap_buy_pass)
     |                              |--- UPSERT Position (p:152, f:50)

  3. After Resolution (PASS wins)
     |--- wallet tx ------------------------------------> Vault.redeem(152 pToken)
     |<-- 152 USDC ------------------------------------|
     |                                                  |
     |                              EVM worker polls TokensRedeemed event
     |                              |--- Projection -> INSERT Trade (action: redeem)
     |                              |--- UPSERT Position (p:0, f:50)
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
  | ...              |  1:N  | eth_chain_id            |       | eth_chain_id  (PK) |
  +------------------+       | proposal_id (bytes32)   |       | tx_hash       (PK) |
                             | market_id   (bytes32)   |       | trader_address     |
                             | vault_address           |       | action (enum)      |
                             | governor_address        |       | collateral_amount  |
                             | router_address          |       | p_token_amount     |
                             | strategy_address        |       | f_token_amount     |
                             | p_token_address         |       | timestamp          |
                             | f_token_address         |       +--------------------+
                             | collateral_address      |       +--------------------+
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
                            | 7. PredictionMarketProjection subscribes
                            |    body.PredictionMarketSwapExecuted:
                            |        |
                            |        v
                            | 8. Projection handler (direct DB mutation):
                            |    -> INSERT PredictionMarketTrade
                            |    -> UPSERT PredictionMarketPosition
                            |    -> UPDATE PredictionMarket.current_probability
```

---

## Design Decisions (from review)

This spec follows two structural decisions identified during review (@Rotorsoft), based on the observation that prediction markets are very similar in nature to the existing quests domain model:

### 1. Single schema file per domain (quests pattern)

Instead of separate schema files per entity, all prediction market entities live in one file — matching how `quest.schemas.ts` covers Quest, QuestActionMeta, QuestTweet, and QuestScore in a single file.

| Quests (reference) | Prediction Markets (this spec) |
|---------------------|-------------------------------|
| `libs/schemas/src/entities/quest.schemas.ts` — Quest, QuestActionMeta, QuestTweet, QuestScore, enums | `libs/schemas/src/entities/prediction-market.schemas.ts` — PredictionMarket, PredictionMarketTrade, PredictionMarketPosition, enums |
| `libs/schemas/src/commands/quest.schemas.ts` — CreateQuest, UpdateQuest, DeleteQuest, CancelQuest | `libs/schemas/src/commands/prediction-market.schemas.ts` — Create, Deploy, Resolve, Cancel, ProjectTrade, ProjectResolution |
| `libs/schemas/src/queries/quest.schemas.ts` — GetQuest, GetQuests | `libs/schemas/src/queries/prediction-market.schemas.ts` — GetPredictionMarkets, GetTrades, GetPositions |

### 2. Single model file + aggregate directory (quests pattern)

All Sequelize models in one file, aggregate directory with one command/query per file and barrel export — matching how `quest.ts` defines both Quest and QuestActionMeta, and `aggregates/quest/` has one file per operation.

| Quests (reference) | Prediction Markets (this spec) |
|---------------------|-------------------------------|
| `libs/model/src/models/quest.ts` — defines Quest + QuestActionMeta models | `libs/model/src/models/prediction_market.ts` — defines PredictionMarket + PredictionMarketTrade + PredictionMarketPosition models |
| `libs/model/src/aggregates/quest/CreateQuest.command.ts` | `libs/model/src/aggregates/prediction_market/CreatePredictionMarket.command.ts` |
| `libs/model/src/aggregates/quest/index.ts` (barrel) | `libs/model/src/aggregates/prediction_market/index.ts` (barrel) |

### Status

- [x] Schema consolidation applied (PM-1)
- [x] Model consolidation applied (PM-1)
- [x] Event storming model generated (see below)
- [x] Tickets derived from model slices (PM-1 through PM-9)
- [x] PM-1 implemented: schemas, models, migration (PR #13361)
- [x] PM-2 Slice 1+2 implemented: Create, Deploy commands + Projection for ProposalCreated/MarketCreated (PR #13372)
- [x] Policy → Projection refactor applied (PR #13381): `PredictionMarket.projection.ts` replaces former `PredictionMarket.policy.ts`
- [x] "Project..." command indirection removed — projection handles DB mutations directly

---

## Event Storming Model

Event storming maps the full domain flow: **Commands** (user intent), **Domain Events** (facts that happened), **Projections** (read model builders that materialize state via direct DB mutations), and **External Systems** (on-chain contracts, EVM worker). Tickets are derived from vertical slices through this model.

### Visual Diagrams (FigJam)

- **[Event Storming Model](https://www.figma.com/online-whiteboard/create-diagram/61090bc5-253e-41c6-a038-01aa15ab6660)** -- Full domain flow: actors, commands, on-chain TX, domain events, outbox/relay, policies, system commands, read models
- **[Lifecycle State Machine](https://www.figma.com/online-whiteboard/create-diagram/9cde7256-9576-4e70-b8ab-436f8a1f4be9)** -- Market states: Draft -> Active -> Resolved/Cancelled with transitions

### Actors

| Actor | Description |
|-------|-------------|
| **Thread Author** | Creates thread, attaches prediction market, can cancel/resolve |
| **Trader** | Mints, swaps, merges, redeems tokens |
| **Community Admin** | Can resolve or cancel markets |
| **EVM Worker** | External system: polls on-chain events every 120s |
| **System (Projection)** | Automated: reacts to domain events with direct DB mutations |

### Aggregate: PredictionMarket

```text
SLICE 1: Market Creation  ✅ COMPLETED (PR #13361, #13372)
=========================================================================================
  Actor            Command                    Event                      Read Model
  -----            -------                    -----                      ----------
  Thread Author -> CreatePredictionMarket  -> PredictionMarketCreated -> PredictionMarketView
                   [ThreadContext auth]        {market_id, thread_id,     (status: draft)
                   [sets thread.has_pm=true]    prompt, collateral,
                                                duration, threshold}

SLICE 2: Market Deployment  ✅ COMPLETED (PR #13372, #13381)
=========================================================================================
  Actor            Command                    Event                      Read Model
  -----            -------                    -----                      ----------
  Thread Author -> DeployPredictionMarket  -> PredictionMarketDeployed-> PredictionMarketView
                   [wallet tx on-chain]        {vault_address,            (status: active,
                   [records addresses]          governor_address,          addresses populated)
                                                router_address,
                                                p_token, f_token,
                                                start_time, end_time}

        +-- External System: EVM Worker polls ProposalCreated log -----+
        |                                                              |
        |   Projection: PredictionMarketProjection                     |
        |   on(ProposalCreated) -> UPDATE market.proposal_id           |
        |   on(MarketCreated)   -> UPDATE market.market_id             |
        |   [direct DB mutation, no command indirection]               |
        +--------------------------------------------------------------+

SLICE 3: Mint Tokens
=========================================================================================
  Actor            External Event             Projection                 Read Model
  -----            --------------             ----------                 ----------
  Trader        -> [wallet: Vault.mint()]

        +-- EVM Worker polls TokensMinted log -------------+
        |                                                  |
        |   Projection: PredictionMarketProjection         |
        |   on(PredictionMarketTokensMinted)                |
        |     -> INSERT PredictionMarketTrade               |
        |        {action: mint, collateral_amount,          |
        |         p_token_amount, f_token_amount}           |
        |     -> UPSERT PredictionMarketPosition            |
        |     -> UPDATE PredictionMarket.total_collateral   |
        |     [direct DB mutation, no command indirection]  |
        +--------------------------------------------------+
                                                             -> TradeHistory
                                                             -> PositionView
                                                                (p:100, f:100)

SLICE 4: Swap (Express Prediction)
=========================================================================================
  Actor            External Event             Projection                 Read Model
  -----            --------------             ----------                 ----------
  Trader        -> [wallet: Router.swap()]

        +-- EVM Worker polls SwapExecuted log -------------+
        |                                                  |
        |   Projection: PredictionMarketProjection         |
        |   on(PredictionMarketSwapExecuted)                |
        |     -> INSERT PredictionMarketTrade               |
        |        {action: swap_buy_pass | swap_buy_fail,    |
        |         amount_in, amount_out}                    |
        |     -> UPSERT PredictionMarketPosition            |
        |     -> UPDATE PredictionMarket.current_probability|
        |     [direct DB mutation, no command indirection]  |
        +--------------------------------------------------+
                                                             -> TradeHistory
                                                             -> PositionView
                                                             -> ProbabilityView

SLICE 5: Merge Tokens
=========================================================================================
  Actor            External Event             Projection                 Read Model
  -----            --------------             ----------                 ----------
  Trader        -> [wallet: Vault.merge()]

        +-- EVM Worker polls TokensMerged log -------------+
        |                                                  |
        |   Projection: PredictionMarketProjection         |
        |   on(PredictionMarketTokensMerged)                |
        |     -> INSERT PredictionMarketTrade               |
        |        {action: merge, p_amount, f_amount,        |
        |         collateral_returned}                      |
        |     -> UPSERT PredictionMarketPosition            |
        |     -> UPDATE PredictionMarket.total_collateral   |
        |     [direct DB mutation, no command indirection]  |
        +--------------------------------------------------+
                                                             -> TradeHistory
                                                             -> PositionView

SLICE 6: Market Resolution
=========================================================================================
  Actor            Command / External         Event                      Read Model
  -----            ------------------         -----                      ----------
  Thread Author -> ResolvePredictionMarket -> PredictionMarketResolved-> PredictionMarketView
  OR Admin         [wallet: Governor.resolve()]                          (status: resolved,
                                                                         winner: 1 or 2)

        +-- EVM Worker polls ProposalResolved log ---------+
        |                                                  |
        |   Projection: PredictionMarketProjection         |
        |   on(PredictionMarketProposalResolved)            |
        |     -> UPDATE PredictionMarket                    |
        |        {status: resolved, winner, resolved_at}    |
        |     [direct DB mutation, no command indirection]  |
        +--------------------------------------------------+

        +-- EVM Worker polls MarketResolved log -----------+
        |   (redundant confirmation from BinaryVault)      |
        |   Projection: same handler, idempotent           |
        +--------------------------------------------------+

SLICE 7: Token Redemption
=========================================================================================
  Actor            External Event             Projection                 Read Model
  -----            --------------             ----------                 ----------
  Trader        -> [wallet: Vault.redeem()]

        +-- EVM Worker polls TokensRedeemed log -----------+
        |                                                  |
        |   Projection: PredictionMarketProjection         |
        |   on(PredictionMarketTokensRedeemed)              |
        |     -> INSERT PredictionMarketTrade               |
        |        {action: redeem, winning_token_amount,     |
        |         collateral_returned}                      |
        |     -> UPSERT PredictionMarketPosition            |
        |     [direct DB mutation, no command indirection]  |
        +--------------------------------------------------+
                                                             -> TradeHistory
                                                             -> PositionView

SLICE 8: Market Cancellation
=========================================================================================
  Actor            Command                    Event                      Read Model
  -----            -------                    -----                      ----------
  Thread Author -> CancelPredictionMarket  -> PredictionMarketCancelled-> PredictionMarketView
  OR Admin         [validates draft/active]                               (status: cancelled)
```

### Domain Events Summary

| Domain Event | Source | Payload | Projection Handler |
|-------------|--------|---------|-------------------|
| PredictionMarketCreated | CreatePredictionMarket cmd | market_id, thread_id, prompt, config | -- |
| PredictionMarketDeployed | DeployPredictionMarket cmd | all contract addresses, times | -- |
| PredictionMarketProposalCreated | EVM: FutarchyGovernor | proposal_id, market_id, addresses | UPDATE market.proposal_id |
| PredictionMarketMarketCreated | EVM: BinaryVault | market_id, p_token, f_token, collateral | UPDATE market.market_id |
| PredictionMarketTokensMinted | EVM: BinaryVault | market_id, user, collateral_amount, token_amounts | INSERT Trade + UPSERT Position |
| PredictionMarketTokensMerged | EVM: BinaryVault | market_id, user, p_amount, f_amount, collateral_out | INSERT Trade + UPSERT Position |
| PredictionMarketSwapExecuted | EVM: FutarchyRouter | market_id, user, buy_pass, amount_in, amount_out | INSERT Trade + UPSERT Position + UPDATE probability |
| PredictionMarketTokensRedeemed | EVM: BinaryVault | market_id, user, winning_amount, collateral_out | INSERT Trade + UPSERT Position |
| PredictionMarketProposalResolved | EVM: FutarchyGovernor | proposal_id, winner | UPDATE market status=resolved, winner |
| PredictionMarketMarketResolved | EVM: BinaryVault | market_id, winner | UPDATE market status=resolved, winner |
| PredictionMarketCancelled | CancelPredictionMarket cmd | market_id | -- |

### EVM Event → Mapper → Projection Mapping

Complete mapping from on-chain ABI events to projection handlers. ABIs sourced from `@commonxyz/common-protocol-abis@1.4.14`.

| # | Contract | ABI Event Signature | Mapper Function | Domain Event | Projection Handler |
|---|----------|--------------------|-----------------|--------------|--------------------|
| 1 | BinaryVault | `MarketCreated(bytes32 indexed marketId, address indexed pToken, address indexed fToken, address collateral)` | `predictionMarketMarketCreatedMapper` | `PredictionMarketMarketCreated` | UPDATE market_id, token addresses |
| 2 | BinaryVault | `TokensMinted(bytes32 indexed marketId, address indexed to, uint256 amount)` | `predictionMarketTokensMintedMapper` | `PredictionMarketTokensMinted` | INSERT Trade + UPSERT Position |
| 3 | BinaryVault | `TokensMerged(bytes32 indexed marketId, address indexed from, uint256 amount)` | `predictionMarketTokensMergedMapper` | `PredictionMarketTokensMerged` | INSERT Trade + UPSERT Position |
| 4 | BinaryVault | `TokensRedeemed(bytes32 indexed marketId, address indexed to, uint256 amount, uint8 outcome)` | `predictionMarketTokensRedeemedMapper` | `PredictionMarketTokensRedeemed` | INSERT Trade + UPSERT Position |
| 5 | BinaryVault | `MarketResolved(bytes32 indexed marketId, uint8 winner)` | `predictionMarketMarketResolvedMapper` | `PredictionMarketMarketResolved` | UPDATE status=resolved, winner |
| 6 | FutarchyGovernor | `ProposalCreated(bytes32 indexed proposalId, bytes32 indexed marketId, address indexed strategy, address collateral, uint256 startTime, uint256 endTime)` | `predictionMarketProposalCreatedMapper` | `PredictionMarketProposalCreated` | UPDATE proposal_id |
| 7 | FutarchyGovernor | `ProposalResolved(bytes32 indexed proposalId, bytes32 indexed marketId, uint8 winner)` | `predictionMarketProposalResolvedMapper` | `PredictionMarketProposalResolved` | UPDATE status=resolved, winner |
| 8 | FutarchyRouter | `SwapExecuted(bytes32 indexed marketId, address indexed user, bool buyPass, uint256 amountIn, uint256 amountOut)` | `predictionMarketSwapExecutedMapper` | `PredictionMarketSwapExecuted` | INSERT Trade + UPSERT Position + UPDATE probability |

### Invariants (Business Rules)

| Invariant | Enforced By | Description |
|-----------|-------------|-------------|
| Only thread author creates PM | authPredictionMarket middleware | ThreadContext auth check |
| Only author/admin resolves | authPredictionMarket middleware | Role-based check |
| Valid status transitions only | Command body validation | draft->active, active->resolved, active->cancelled, draft->cancelled |
| No duplicate positions | DB UNIQUE constraint | (prediction_market_id, user_address) |
| No duplicate trades | DB composite PK | (eth_chain_id, transaction_hash) |
| Idempotent event processing | Composite PK on Trade | Same tx_hash silently rejected |
| Market must be active for trading | On-chain contract | BinaryVault enforces market state |
| TWAP threshold for resolution | On-chain contract | FutarchyGovernor enforces >= threshold |

### Read Models (Projections)

| Read Model | Source Events | What it Shows |
|------------|---------------|---------------|
| PredictionMarketView | Created, Deployed, Resolved, Cancelled | Full market state: status, addresses, probability, winner |
| TradeHistory | TokensMinted, SwapExecuted, TokensMerged, TokensRedeemed | Paginated list of all trades for a market |
| PositionView | All trade events | Per-user token balances (p_token, f_token, total_collateral_in) |
| ProbabilityView | SwapExecuted | Current TWAP-derived probability (updated on each swap) |

### Event Flow Diagram

```text
  +--------+     +---------+     +----------+     +---------+     +----------+
  | Thread |     |         |     |          |     |         |     |          |
  | Author |---->| Command |---->|  Domain  |---->| Outbox  |---->| RabbitMQ |
  |        |     |         |     |  Event   |     |  Table  |     |  (Rascal)|
  +--------+     +---------+     +----------+     +---------+     +----+-----+
                                                                       |
  +--------+     +---------+     +----------+                          |
  |  EVM   |     | Event   |     |  Domain  |                          |
  | Worker |---->| Mapper  |---->|  Event   |--------------------------+
  | (120s) |     | (ABI    |     | (Outbox) |                          |
  +--------+     | decode) |     +----------+                          |
                 +---------+                                           |
                                                                       v
                                      +--------------------------------+-----------+
                                      |     PredictionMarketProjection             |
                                      |     (direct DB mutations, no commands)     |
                                      |                                            |
                                      |  on(TokensMinted)    -> INSERT Trade       |
                                      |  on(SwapExecuted)    -> INSERT Trade       |
                                      |  on(TokensMerged)    -> INSERT Trade       |
                                      |  on(TokensRedeemed)  -> INSERT Trade       |
                                      |  on(ProposalCreated) -> UPDATE market      |
                                      |  on(MarketCreated)   -> UPDATE market      |
                                      |  on(ProposalResolved)-> UPDATE status      |
                                      |  on(MarketResolved)  -> UPDATE status      |
                                      +---+----------------------------------------+
                                          |
                                          v
                                      +---+------+
                                      |  Read    |
                                      |  Models  |
                                      |  (query) |
                                      +----------+
```

---

## Engineering Tickets (Derived from Model Slices)

Tickets are cut as vertical slices through the event storming model. Each slice delivers end-to-end value from schema through to read model.

### TICKET PM-1: Schemas + Models + Migration (Slices 1-8 foundation) -- ✅ COMPLETED

**Size:** M | **Depends on:** nothing | **Blocks:** PM-2, PM-3

Foundation layer: all Zod schemas (single file per category, like quests) and Sequelize models.

**Files to create:**

- `libs/schemas/src/entities/prediction-market.schemas.ts` (all entities: PredictionMarket, PredictionMarketTrade, PredictionMarketPosition, enums)
- `libs/schemas/src/commands/prediction-market.schemas.ts` (all commands)
- `libs/schemas/src/queries/prediction-market.schemas.ts` (all queries)
- `libs/model/src/models/prediction_market.ts` (all 3 Sequelize models: PredictionMarket, PredictionMarketTrade, PredictionMarketPosition)
- `libs/model/migrations/YYYYMMDDHHMMSS-create-prediction-markets.js`

**Files to modify:**

- `libs/schemas/src/entities/index.ts`
- `libs/schemas/src/commands/index.ts`
- `libs/schemas/src/queries/index.ts`
- `libs/schemas/src/context.ts` (add `PredictionMarketContext`)
- `libs/schemas/src/events/events.schemas.ts` (8 new domain event types)
- `libs/model/src/models/factories.ts` (register 3 models)
- `libs/model/src/models/index.ts` (export types)
- `libs/model/src/models/associations.ts` (add relationships)
- `libs/model/src/models/thread.ts` (no thread flag; use PredictionMarket thread FK)

**Follows quests pattern:**

- Single entity schema file covers all entities (like `quest.schemas.ts` covers Quest, QuestActionMeta, QuestTweet, QuestScore)
- Single model file defines all related Sequelize models (like `quest.ts` defines Quest + QuestActionMeta)

**Acceptance criteria:**

- [ ] Single `prediction-market.schemas.ts` exports: PredictionMarket, PredictionMarketTrade, PredictionMarketPosition, PredictionMarketStatus enum, PredictionMarketTradeAction enum
- [ ] Single `prediction_market.ts` model file defines all 3 Sequelize models
- [ ] `PredictionMarkets` table with DECIMAL(78,0) for amounts
- [ ] `PredictionMarketTrades` table with composite PK (eth_chain_id, transaction_hash)
- [ ] `PredictionMarketPositions` table with UNIQUE (prediction_market_id, user_address)
- [ ] No `Threads.has_prediction_market` column (use PredictionMarket thread FK instead)
- [ ] Associations: Community->PM (1:N), Thread->PM (1:N), PM->Trade (1:N), PM->Position (1:N)
- [ ] Indexes on: thread_id, market_id, status, vault_address, trader_address, PredictionMarket (status, end_time)
- [ ] `PredictionMarketContext` added to context.ts
- [ ] 8 domain event schemas in events.schemas.ts
- [ ] Migration runs + rolls back cleanly
- [ ] `pnpm -r check-types` passes

**Tests:**

- Schema validation: valid/invalid inputs for each entity + command schema
- Enum validation: status in [draft, active, resolved, cancelled], action in [mint, merge, swap_buy_pass, swap_buy_fail, redeem]
- Model creation with all required fields
- Unique/composite PK constraint enforcement

---

### TICKET PM-2: Slice 1+2 -- Create + Deploy Market (Commands + Projection) -- ✅ COMPLETED

**Size:** L | **Depends on:** PM-1 | **Blocks:** PM-3, PM-4

Market lifecycle commands following existing aggregate patterns (like `aggregates/quest/`).

**Files to create (in `libs/model/src/aggregates/prediction_market/`):**

- `CreatePredictionMarket.command.ts` (Slice 1)
- `DeployPredictionMarket.command.ts` (Slice 2)
- `CancelPredictionMarket.command.ts` (Slice 8)
- `ResolvePredictionMarket.command.ts` (Slice 6)
- `GetPredictionMarkets.query.ts`
- `GetPredictionMarketTrades.query.ts`
- `GetPredictionMarketPositions.query.ts`
- `index.ts`

**Files to modify:**

- `libs/model/src/index.ts` (export aggregate)
- `libs/model/src/middleware/auth.ts` (add `authPredictionMarket()`)

**Acceptance criteria:**

- [ ] `CreatePredictionMarket`: ThreadContext auth (thread author), creates PM linked to thread
- [ ] `DeployPredictionMarket`: updates PM with on-chain addresses, sets status=active, records start/end time
- [ ] `ResolvePredictionMarket`: only thread author or admin, validates market is active, sets winner
- [ ] `CancelPredictionMarket`: only thread author or admin, validates market is draft/active
- [ ] Queries return markets/trades/positions with proper eager loading and pagination
- [ ] `authPredictionMarket()` middleware validates actor permissions
- [ ] All commands use transactions
- [ ] `pnpm -r check-types` passes

**Tests:**

- Create: success, non-author rejected, duplicate on thread
- Deploy: success, invalid status transition rejected (cancelled -> active)
- Resolve: success, non-author non-admin rejected, already resolved rejected
- Cancel: success, already resolved rejected
- State machine: only valid transitions (draft->active, active->resolved, active->cancelled, draft->cancelled)

---

### TICKET PM-3: Slice 3-7 -- Trade + Resolution Projection (Extend PredictionMarketProjection)

**Size:** L | **Depends on:** PM-1, PM-2, PM-4 | **Blocks:** PM-5

Extend `PredictionMarket.projection.ts` with handlers for all remaining on-chain events. The projection mutates the DB directly — no command indirection (no `ProjectPredictionMarketTrade.command.ts` or `ProjectPredictionMarketResolution.command.ts`).

**Architecture:** EVM event → mapper → Outbox → RabbitMQ → `PredictionMarketProjection` handler → direct DB mutation

**Files to modify:**

- `libs/model/src/aggregates/prediction_market/PredictionMarket.projection.ts` (add 6 new event handlers)
- `libs/model/src/services/evmChainEvents/chain-event-utils.ts` (8 mappers)

**New event handlers in PredictionMarketProjection:**

| Event | DB Mutation |
|-------|-------------|
| `PredictionMarketTokensMinted` | INSERT Trade (action: mint) + UPSERT Position + UPDATE total_collateral |
| `PredictionMarketSwapExecuted` | INSERT Trade (action: swap_buy_pass/fail) + UPSERT Position + UPDATE current_probability |
| `PredictionMarketTokensMerged` | INSERT Trade (action: merge) + UPSERT Position + UPDATE total_collateral |
| `PredictionMarketTokensRedeemed` | INSERT Trade (action: redeem) + UPSERT Position |
| `PredictionMarketProposalResolved` | UPDATE PredictionMarket (status=resolved, winner, resolved_at) |
| `PredictionMarketMarketResolved` | UPDATE PredictionMarket (status=resolved, winner, resolved_at) |

**Acceptance criteria:**

- [ ] `PredictionMarketProjection` handles all 8 domain events (2 existing + 6 new) with direct DB mutations
- [ ] No `ProjectPredictionMarketTrade.command.ts` or `ProjectPredictionMarketResolution.command.ts` files created
- [ ] No `command()` calls inside the projection
- [ ] 8 mapper functions decode raw EVM logs using ABIs → typed event payloads
- [ ] Projection already registered in rascalConsumerMap (done in PM-2)
- [ ] Idempotent: composite PK prevents duplicate trades
- [ ] `pnpm -r check-types` passes

**Tests:**

- Projection handlers: mint creates Trade + Position, swap updates balances, merge reduces both, redeem reduces winning tokens
- Position aggregation: mint 100 + swap 50 fToken = position(p:152, f:50)
- Mapper tests: raw log hex → decoded event payload (each of 8 events)
- Projection integration: mock event → verify DB state
- Idempotency: same event twice, no duplicate trades

---

### TICKET PM-4: Event Signatures + Registry + Contract Helpers

**Size:** M | **Depends on:** nothing | **Blocks:** PM-3

Register event signatures and contract sources for chain event polling. ABIs are already published as `@commonxyz/common-protocol-abis@1.4.14` (already in `package.json`) — no ABI files need to be created.

**ABI imports (from `@commonxyz/common-protocol-abis`):**

```typescript
import { BinaryVaultAbi, FutarchyGovernorAbi, FutarchyRouterAbi } from '@commonxyz/common-protocol-abis';
```

**On-chain event signatures (8 events from 3 contracts):**

| Contract | Event Signature | Parameters |
|----------|----------------|------------|
| BinaryVault | `MarketCreated(bytes32 indexed marketId, address indexed pToken, address indexed fToken, address collateral)` | market_id, token addresses |
| BinaryVault | `TokensMinted(bytes32 indexed marketId, address indexed to, uint256 amount)` | market_id, recipient, amount |
| BinaryVault | `TokensMerged(bytes32 indexed marketId, address indexed from, uint256 amount)` | market_id, sender, amount |
| BinaryVault | `TokensRedeemed(bytes32 indexed marketId, address indexed to, uint256 amount, uint8 outcome)` | market_id, recipient, amount, outcome |
| BinaryVault | `MarketResolved(bytes32 indexed marketId, uint8 winner)` | market_id, winner |
| FutarchyGovernor | `ProposalCreated(bytes32 indexed proposalId, bytes32 indexed marketId, address indexed strategy, address collateral, uint256 startTime, uint256 endTime)` | proposal_id, market_id, strategy, collateral, times |
| FutarchyGovernor | `ProposalResolved(bytes32 indexed proposalId, bytes32 indexed marketId, uint8 winner)` | proposal_id, market_id, winner |
| FutarchyRouter | `SwapExecuted(bytes32 indexed marketId, address indexed user, bool buyPass, uint256 amountIn, uint256 amountOut)` | market_id, user, direction, amounts |

**Files to create:**

- `libs/evm-protocols/src/common-protocol/contractHelpers/predictionMarket.ts`

**Files to modify:**

- `libs/evm-protocols/src/event-registry/eventSignatures.ts` (8 signatures)
- `libs/evm-protocols/src/event-registry/eventRegistry.ts` (3 contract sources)

**Acceptance criteria:**

- [ ] ABIs imported from `@commonxyz/common-protocol-abis` (no local ABI files created)
- [ ] 8 event signature hashes computed and registered under `PredictionMarket` namespace
- [ ] 3 contract sources: binaryVaultSource (5 events), futarchyGovernorSource (2), futarchyRouterSource (1)
- [ ] Sources registered for Base, Base Sepolia, and Anvil chain IDs
- [ ] Contract helpers wrap: createProposal, mintTokens, mergeTokens, swapTokens, resolveProposal, redeemTokens, getCurrentProbability, getMarketInfo
- [ ] `pnpm -r check-types` passes

**Tests:**

- Event signature hashes match keccak256 of Solidity event signatures
- Contract helper unit tests with mocked providers

---

### TICKET PM-5: tRPC API Routes + External Router

**Size:** S | **Depends on:** PM-2 | **Blocks:** PM-6

Wire up tRPC routes for all prediction market commands and queries.

**Files to create:**

- `packages/commonwealth/server/api/prediction-market.ts`

**Files to modify:**

- `packages/commonwealth/server/api/external-router.ts`

**Acceptance criteria:**

- [ ] All 7 routes registered: createPredictionMarket, deployPredictionMarket, resolvePredictionMarket, cancelPredictionMarket, getPredictionMarkets, getPredictionMarketTrades, getPredictionMarketPositions
- [ ] Mutations have Mixpanel analytics tracking
- [ ] External API routes registered in `external-router.ts`
- [ ] `pnpm -r check-types` passes

**Tests:**

- Integration tests hitting each tRPC endpoint
- Auth: unauthenticated requests rejected for mutations
- Full CRUD flow: create -> deploy -> query -> resolve

---

### TICKET PM-6: Frontend React Query Hooks

**Size:** S | **Depends on:** PM-5 | **Blocks:** PM-7

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

- [ ] `useCreatePredictionMarketMutation` wraps createPredictionMarket
- [ ] `useDeployPredictionMarketMutation` wraps deploy endpoint
- [ ] `useResolvePredictionMarketMutation` wraps resolve endpoint
- [ ] `useGetPredictionMarketsQuery(threadId)` with staleTime: 30s
- [ ] `useGetPredictionMarketTradesQuery(marketId)` fetches trade history
- [ ] `useGetPredictionMarketPositionsQuery(marketId)` fetches positions
- [ ] All mutations invalidate relevant queries on success
- [ ] `pnpm -r check-types` passes

---

### TICKET PM-7: Frontend Components + Thread Integration

**Size:** XL | **Depends on:** PM-6 | **Blocks:** PM-8

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

**Sub-tickets (by slice):**

#### PM-7a: Market Card (Slice 1+2 read model)

- [ ] Shows market prompt, status badge (DRAFT/ACTIVE/RESOLVED/CANCELLED)
- [ ] Probability bar: green (PASS) / red (FAIL) proportional fill
- [ ] Total collateral locked, time remaining
- [ ] Cancel button for thread author (draft/active only)
- [ ] Skeleton loading state, responsive layout

#### PM-7b: Editor Modal (Slice 1+2 commands)

- [ ] Prompt input, collateral selector (USDC/WETH/custom ERC20), duration picker (1-90d)
- [ ] Resolution threshold slider (default 55%), initial liquidity input
- [ ] "Create and Deploy" triggers: DB record -> wallet tx -> record deployment
- [ ] Loading/error states during wallet interaction

#### PM-7c: Trade Modal (Slices 3-5,7 commands)

- [ ] **Mint tab:** amount input, collateral cost, "Deposit and Mint"
- [ ] **Swap tab:** PASS/FAIL toggle, amount, slippage (1%), estimated output
- [ ] **Merge tab:** amount (limited to min balance), collateral returned
- [ ] **Redeem tab:** (post-resolution only) amount, collateral returned
- [ ] Shows token balances, wallet tx via contract helpers, loading/error states
- [ ] Tabs disabled by market status (swap off when resolved, redeem off when active)

#### PM-7d: Resolve Modal (Slice 6 command)

- [ ] Current TWAP probability, TWAP window selector, predicted outcome
- [ ] "Resolve Market" triggers Governor.resolve() on-chain
- [ ] Only visible to thread author / community admin, only enabled after end_time

#### PM-7e: Thread Integration (all slices)

- [ ] NewThreadForm: "Prediction Market" button opens editor modal
- [ ] ViewThreadPage: card rendered when prediction market exists for thread

---

### TICKET PM-8: Feature Flag + Community Setting

**Size:** S | **Depends on:** PM-7 | **Blocks:** nothing

- [ ] Feature flag `FLAG_PREDICTION_MARKETS` defined
- [ ] All PM UI behind `useFlag('prediction_markets')`
- [ ] API routes still functional when flag is off (flag only gates UI)
- [ ] Flag togglable per environment

---

### TICKET PM-9: Testing + QA

**Size:** L | **Depends on:** PM-1 through PM-8 | **Blocks:** nothing

See detailed test plan below.

---

## Dependency Graph

```text
  PM-1 (Schemas + Models + Migration) ✅ DONE
    |
    +-------> PM-2 (Create/Deploy + Projection for ProposalCreated/MarketCreated) ✅ DONE
    |            |
    |            +-------> PM-3 (Extend Projection: 6 new event handlers)
    |            |              ^
    |            |              |
    |            +-------> PM-5 (tRPC Routes)
    |                        |
    |                        +-------> PM-6 (React Query Hooks)
    |                                    |
    |                                    +-------> PM-7 (Frontend Components)
    |                                                 |
    +-------> PM-4 (Event Sigs + Registry)--+         +-------> PM-8 (Feature Flag)
              [imports ABIs from npm]       |         |
                                            +-> PM-3  +-------> PM-9 (Testing)
```

**Parallelizable work:**

- PM-4 can start now (no remaining dependencies)
- PM-3 and PM-5 can run in parallel after PM-4
- PM-6 and PM-3 can run in parallel after PM-5

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
| Projection - mint | `libs/model/test/prediction-market/Projection.spec.ts` | Creates trade + position with both token balances |
| Projection - swap | same | Updates position, changes token balances |
| Projection - merge | same | Reduces both token balances, returns collateral |
| Projection - redeem | same | Reduces winning token balance |
| Projection - resolve | same | Updates market status and winner |
| State machine | `libs/model/test/prediction-market/Resolution.spec.ts` | Only valid transitions allowed |
| Event mappers | `libs/model/test/prediction-market/EventMappers.spec.ts` | Raw hex logs decoded to typed payloads |

### Integration Tests

| Test | File | What it validates |
|------|------|-------------------|
| API CRUD | `test/integration/api/prediction-markets.spec.ts` | Full lifecycle via tRPC: create->deploy->query->resolve |
| Auth enforcement | same | Non-author cannot create/resolve/cancel |
| Trade projection | same | Projection handlers correctly update DB from mock events |
| Chain event pipeline | `test/integration/chain-events/prediction-market-events.spec.ts` | Mock EVM logs -> mapper -> outbox -> projection -> DB verification |
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

### Phase 1: Schemas + Models + Migration (PM-1) -- ✅ COMPLETED

**New files:**

- `libs/schemas/src/entities/prediction-market.schemas.ts` (single file: all entities + enums)
- `libs/schemas/src/commands/prediction-market.schemas.ts`
- `libs/schemas/src/queries/prediction-market.schemas.ts`
- `libs/model/src/models/prediction_market.ts` (single file: all 3 Sequelize models)
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

### Phase 2: Backend Aggregates + API (PM-2 + PM-4 + PM-5) -- ✅ PARTIALLY COMPLETED

**Completed files (PM-2):**

- `libs/model/src/aggregates/prediction_market/CreatePredictionMarket.command.ts` ✅
- `libs/model/src/aggregates/prediction_market/DeployPredictionMarket.command.ts` ✅
- `libs/model/src/aggregates/prediction_market/GetPredictionMarkets.query.ts` ✅
- `libs/model/src/aggregates/prediction_market/PredictionMarket.projection.ts` ✅ (handles ProposalCreated + MarketCreated)
- `libs/model/src/aggregates/prediction_market/index.ts` ✅
- `packages/commonwealth/server/api/predictionMarket.ts` ✅

**Remaining files:**

- `libs/model/src/aggregates/prediction_market/ResolvePredictionMarket.command.ts`
- `libs/model/src/aggregates/prediction_market/CancelPredictionMarket.command.ts`
- `libs/model/src/aggregates/prediction_market/GetPredictionMarketTrades.query.ts`
- `libs/model/src/aggregates/prediction_market/GetPredictionMarketPositions.query.ts`

**Modified files:**

- `libs/model/src/index.ts`
- `libs/model/src/middleware/auth.ts`
- `packages/commonwealth/server/api/external-router.ts`

### Phase 3: Chain Events Integration (PM-3 + PM-4)

**New files:**

- `libs/evm-protocols/src/common-protocol/contractHelpers/predictionMarket.ts`

**Modified files:**

- `libs/model/src/aggregates/prediction_market/PredictionMarket.projection.ts` (extend with 6 new event handlers)
- `libs/evm-protocols/src/event-registry/eventSignatures.ts` (8 event signatures)
- `libs/evm-protocols/src/event-registry/eventRegistry.ts` (3 contract sources)
- `libs/model/src/services/evmChainEvents/chain-event-utils.ts` (8 mappers)

**Note:** No ABI files to create — import from `@commonxyz/common-protocol-abis`. No policy file — projection handles all events with direct DB mutations. No `ProjectPredictionMarketTrade.command.ts` or `ProjectPredictionMarketResolution.command.ts` — these are anti-patterns per the enforced architecture rule.

### Phase 4: Frontend (PM-6 + PM-7 + PM-8)

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
| LaunchpadTrade projection | `libs/model/src/aggregates/launchpad/LaunchpadTrade.projection.ts` | PredictionMarketProjection (direct DB mutations) |
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

The 9 tickets (PM-1 through PM-9) above are pre-cut with:

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

---

## Frontend Touch Points (PM-7 through PM-18)

The prediction market UI integrates into **7 existing surfaces** plus **2 new pages**. This follows the same pattern as contests, quests, and the existing external markets feature — each has: card component, list component, explore tab, community homepage section, sidebar nav entry, admin settings page.

```text
Touch Points:

1. Thread View (sidebar card)       -- ViewThreadPage.tsx sidebarComponents[]
2. Thread Creation (editor modal)   -- NewThreadForm.tsx "Prediction Market" button
3. Explore Page (tab + AllTab)      -- ExplorePage.tsx TAB_VIEWS[], AllTabContent section
4. Community Homepage (section)     -- CommunityHomePage.tsx (like ActiveContestList)
5. Global Homepage (section)        -- HomePage.tsx (like ActiveContestList)
6. Sidebar Navigation (nav entry)   -- governance_section.tsx (like "Markets", "Contests")
7. Admin Settings (config page)     -- CommunityManagement/ (like Markets/MarketsPage.tsx)
8. Dedicated App Page (full view)   -- PredictionMarketsAppPage.tsx (like MarketsAppPage.tsx)
9. Thread List (badge/tag)          -- ThreadContestTag pattern for market status
```

### Existing patterns to follow

| Surface | Existing Reference | Pattern |
|---------|-------------------|---------|
| Thread sidebar card | `ThreadPollCard.tsx` → wraps `PollCard.tsx` in `CWContentPageCard` | Collapsible card in sidebarComponents[] array |
| Thread creation | `ThreadPollEditorCard.tsx` → opens `poll_editor_modal.tsx` | Button in NewThreadForm, opens modal |
| Explore page tab | `ExplorePage.tsx` → `MarketsList` component gated by `marketsEnabled` | Tab in TAB_VIEWS[], section in AllTabContent |
| Community homepage | `ActiveContestList.tsx` (horizontal scroll cards, `isCommunityHomePage` prop) | Section with `CWSectionHeader` + horizontal scroll |
| Global homepage | `ActiveContestList.tsx`, `XpQuestList.tsx` (3-item preview + "See all") | Section between existing content blocks |
| Sidebar nav | `governance_section.tsx` → "Markets" entry gated by `useFlag('markets')` | Menu item in Apps section, gated by feature flag |
| Admin settings | `CommunityManagement/Markets/MarketsPage.tsx` → `MarketSelector` | Admin page at `/:scope/manage/prediction-markets` |
| App page | `MarketsAppPage.tsx` (tabs: "My Markets" / "Discover", subscriptions) | Tabbed page at `/:scope/prediction-markets` |
| Thread badge | `ThreadContestTag.tsx` → popover with title/date/prize | Small tag on thread cards showing market status + probability |

---

### TICKET PM-7: PredictionMarketCard — Reusable Card Component

**Size:** M | **Depends on:** PM-6 | **Blocks:** PM-8, PM-9, PM-10, PM-11, PM-12, PM-13, PM-14, PM-15

Base presentational card used across all surfaces (like `PollCard` is to `ThreadPollCard`).

**Files to create:**

- `client/scripts/views/components/PredictionMarketCard/PredictionMarketCard.tsx`
- `client/scripts/views/components/PredictionMarketCard/PredictionMarketCard.scss`
- `client/scripts/utils/prediction-markets.ts`

**Follows:** `client/scripts/views/components/Polls/PollCard/PollCard.tsx`

**Acceptance criteria:**

- [ ] Shows market prompt, status badge (DRAFT/ACTIVE/RESOLVED/CANCELLED)
- [ ] Probability bar: green (PASS) / red (FAIL) proportional fill
- [ ] Total collateral locked, time remaining via `CWCountDownTimer`
- [ ] Winner display when resolved
- [ ] Cancel button for thread author (draft/active only)
- [ ] Skeleton loading state, responsive layout
- [ ] Compact variant for explore/homepage cards (330px width, horizontal scroll)
- [ ] Full variant for thread sidebar (full-width in `CWContentPageCard`)
- [ ] Root CSS class `.PredictionMarketCard`, component-scoped SCSS

**Component hierarchy:**

```text
PredictionMarketCard (PM-7)                    <-- shared presentational base
|
+-- [full variant]
|   |
|   +-- ThreadPredictionMarketCard (PM-8)      <-- wraps card with trade actions + gating
|   |     rendered inside:
|   |       ViewThreadPage.tsx -> sidebarComponents[] -> CWContentPageCard
|   |
|   +-- PredictionMarketsAppPage (PM-14)       <-- tabbed list: Active / My Positions / Resolved
|         rendered at: /:scope/prediction-markets
|
+-- [compact variant, 330px]
    |
    +-- ActivePredictionMarketList (PM-13)      <-- horizontal scroll, "See all" link
    |     rendered inside: HomePage.tsx, CommunityHomePage.tsx
    |
    +-- PredictionMarketsList (PM-12)           <-- filterable list, infinite scroll
    |     rendered inside: ExplorePage.tsx, AllTabContent.tsx
    |
    +-- ThreadPredictionMarketTag (PM-15)       <-- compact badge on thread cards
          rendered inside: ThreadCard (feed views)
```

**Card states (full variant):**

```text
  DRAFT                         ACTIVE                        RESOLVED
  +-------------------------+   +-------------------------+   +-------------------------+
  | Will ETH reach $5k?     |   | Will ETH reach $5k?     |   | Will ETH reach $5k?     |
  |                         |   |                         |   |                         |
  | Status: [DRAFT]         |   | Status: [ACTIVE] 23d    |   | Status: [RESOLVED]      |
  |                         |   |                         |   | Winner: PASS            |
  | Awaiting deployment...  |   | PASS 62% ████████░░ FAIL|   |                         |
  |                         |   |                         |   | PASS 73% █████████░ FAIL|
  |           [Cancel]      |   | Locked: 12,450 USDC     |   |                         |
  +-------------------------+   |                         |   |           [Redeem]      |
                                | [Trade]      [Cancel]   |   +-------------------------+
  CANCELLED                     +-------------------------+
  +-------------------------+                               COMPACT (330px)
  | Will ETH reach $5k?     |                               +------------------+
  |                         |                               | Will ETH reach   |
  | Status: [CANCELLED]     |                               | $5k?             |
  |                         |                               | PASS: 62%        |
  | This market was         |                               | 23d left         |
  | cancelled.              |                               | 12.4k USDC       |
  +-------------------------+                               +------------------+
```

---

### TICKET PM-8: Thread View — Sidebar Card + Editor Card

**Size:** M | **Depends on:** PM-7 | **Blocks:** PM-17

Integration into `ViewThreadPage.tsx` sidebarComponents[] array, following poll pattern.

**Files to create:**

- `client/scripts/views/pages/view_thread/ThreadPredictionMarketCard.tsx`
- `client/scripts/views/pages/view_thread/ThreadPredictionMarketEditorCard.tsx`
- `client/scripts/views/pages/view_thread/prediction_market_cards.scss`

**Files to modify:**

- `client/scripts/views/pages/view_thread/ViewThreadPage.tsx` (add to sidebarComponents[])

**Follows:** `client/scripts/views/pages/view_thread/ThreadPollCard.tsx`

```typescript
// ViewThreadPage.tsx — add to sidebarComponent[] (like polls at line 692)
...(predictionMarketData?.length > 0 || (isAuthor && predictionMarketsEnabled)
  ? [{
      label: 'Prediction Markets',
      item: (
        <CWContentPageCard header="Prediction Markets" content={
          <>
            {predictionMarketData?.map(market => (
              <ThreadPredictionMarketCard key={market.id} market={market} ... />
            ))}
            {isAuthor && <ThreadPredictionMarketEditorCard thread={thread} ... />}
          </>
        } />
      ),
    }]
  : []),
```

**Acceptance criteria:**

- [ ] `ThreadPredictionMarketCard` wraps `PredictionMarketCard` with trade actions + permission gating via `actionGroups`/`bypassGating`
- [ ] `ThreadPredictionMarketEditorCard` shows "Create Prediction Market" button, opens editor modal
- [ ] Uses `useGetPredictionMarketsQuery(threadId)` for data
- [ ] `useTopicGating` for permission checks (add `GatedActionEnum.UPDATE_PREDICTION_MARKET`)
- [ ] Follows `ThreadPollCard` → `PollCard` delegation pattern

**Wireframe:**

```text
  ViewThreadPage (sidebar)
  +---------------------------------------+
  | Prediction Markets                    |
  | +-----------------------------------+ |
  | | Will ETH reach $5k?              | |
  | |                                   | |
  | | Status: [ACTIVE]    23d remaining | |
  | |                                   | |
  | | PASS 62% ████████████░░░░░░ FAIL  | |
  | |                                   | |
  | | Locked: 12,450 USDC              | |
  | |                                   | |
  | | [Trade]              [Cancel]     | |
  | +-----------------------------------+ |
  |                                       |
  | +-----------------------------------+ |
  | | [+] Create Prediction Market      | |
  | +-----------------------------------+ |
  +---------------------------------------+
```

---

### TICKET PM-9: Editor Modal — Market Creation

**Size:** M | **Depends on:** PM-7 | **Blocks:** PM-17

Market creation modal, triggered from thread view editor card and NewThreadForm.

**Files to create:**

- `client/scripts/views/modals/prediction_market_editor_modal.tsx`

**Files to modify:**

- `client/scripts/views/components/NewThreadForm/NewThreadForm.tsx` (add "Prediction Market" button alongside "Poll")

**Follows:** `client/scripts/views/modals/poll_editor_modal.tsx`, `client/scripts/views/pages/view_thread/ThreadPollEditorCard.tsx`

**Acceptance criteria:**

- [ ] Prompt input, collateral selector (USDC/WETH/custom ERC20), duration picker (1-90d)
- [ ] Resolution threshold slider (default 55%), initial liquidity input
- [ ] "Create and Deploy" triggers: DB record -> wallet tx -> record deployment
- [ ] Loading/error states during wallet interaction
- [ ] AI-powered prompt generation (reuse `useAiCompletion` like `ThreadPollEditorCard`)
- [ ] Integration in `NewThreadForm.tsx`: "Prediction Market" button alongside existing "Poll" button

**Wireframe:**

```text
  NewThreadForm                          Editor Modal
  +---------------------------+          +---------------------------+
  | Write your thread...      |          | Create Prediction Market  |
  | _________________________ |          |                           |
  |                           |  click   | Prompt:                   |
  | [Poll] [Prediction Market]| -------> | [Will ETH reach $5k?   ] |
  +---------------------------+          |                [AI] btn   |
                                         |                           |
                                         | Collateral: [USDC v]     |
                                         | Duration:   [30 days v]  |
                                         | Threshold:  [55%    ===] |
                                         | Liquidity:  [1000 USDC]  |
                                         |                           |
                                         | [Cancel]  [Create & Deploy]
                                         +---------------------------+
                                                    |
                                                    | 1. POST createPredictionMarket (status=draft)
                                                    | 2. Wallet TX: Vault.createMarket()
                                                    | 3. POST deployPredictionMarket (status=active)
                                                    v
```

---

### TICKET PM-10: Trade Modal — Mint/Swap/Merge/Redeem

**Size:** L | **Depends on:** PM-7 | **Blocks:** PM-17

Tabbed trading modal for all token operations.

**Files to create:**

- `client/scripts/views/modals/prediction_market_trade_modal.tsx`

**Follows:** `client/scripts/views/components/ThreadTokenDrawer/ThreadTokenDrawer.tsx` (tabbed trading pattern)

**Acceptance criteria:**

- [ ] **Mint tab:** amount input, collateral cost, "Deposit and Mint"
- [ ] **Swap tab:** PASS/FAIL toggle, amount, slippage (1%), estimated output
- [ ] **Merge tab:** amount (limited to min balance), collateral returned
- [ ] **Redeem tab:** (post-resolution only) amount, collateral returned
- [ ] Shows token balances, wallet tx via contract helpers, loading/error states
- [ ] Tabs disabled by market status (swap off when resolved, redeem off when active)

**Wireframe — all 4 tabs:**

```text
  Mint Tab                               Swap Tab
  +---------------------------------------+  +---------------------------------------+
  | Trade: Will ETH reach $5k?           |  | Trade: Will ETH reach $5k?           |
  |                                       |  |                                       |
  | [Mint] [Swap] [Merge] [Redeem]       |  | [Mint] [Swap] [Merge] [Redeem]       |
  | ====== ~~~~~~ ~~~~~~~ ~~~~~~~~       |  | ~~~~~~ ====== ~~~~~~~ ~~~~~~~~       |
  |                                       |  |                                       |
  | Deposit collateral to mint tokens:   |  | Buy:  (x) PASS  ( ) FAIL            |
  |                                       |  |                                       |
  | Amount: [100        ] USDC           |  | Sell:   [50         ] FAIL tokens    |
  |                                       |  | Receive: ~48.2 PASS tokens (est.)   |
  | You receive:                         |  | Slippage: 1%                         |
  |   100 PASS tokens                    |  |                                       |
  |   100 FAIL tokens                    |  | [Cancel]              [Swap]         |
  |                                       |  +---------------------------------------+
  | [Cancel]        [Deposit and Mint]   |
  +---------------------------------------+  Merge Tab
                                             +---------------------------------------+
  Redeem Tab (post-resolution only)          | Trade: Will ETH reach $5k?           |
  +---------------------------------------+  |                                       |
  | Trade: Will ETH reach $5k?           |  | [Mint] [Swap] [Merge] [Redeem]       |
  |                                       |  | ~~~~~~ ~~~~~~ ======= ~~~~~~~~       |
  | [Mint] [Swap] [Merge] [Redeem]       |  |                                       |
  | ~~~~~~ ~~~~~~ ~~~~~~~ ========       |  | Merge equal tokens back to collateral|
  |  off    off    off                   |  |                                       |
  |                                       |  | Amount: [25         ] token pairs    |
  | Market resolved: PASS wins           |  | (max: 50 -- limited to min balance)  |
  |                                       |  |                                       |
  | Your PASS balance: 148 tokens        |  | You receive: 25 USDC                 |
  | Redeem: [148        ] PASS tokens    |  |                                       |
  |                                       |  | [Cancel]              [Merge]        |
  | You receive: 148 USDC               |  +---------------------------------------+
  |                                       |
  | [Cancel]              [Redeem]       |
  +---------------------------------------+
```

**Data flow — frontend to chain (applies to PM-9, PM-10, PM-11):**

```text
  CREATE FLOW (PM-9):
  EditorModal -----> useCreatePredictionMarketMutation
                       |
                       +----> POST /predictionMarket/create ------> DB insert (draft)
                       |
                     user wallet signs TX
                       |
                       +----> Vault.createMarket() ----------------> on-chain
                       +----> Governor.createProposal() -----------> on-chain
                       |
                       +----> POST /predictionMarket/deploy ------> DB update (active)

  TRADE FLOW (PM-10):
  TradeModal -------> user wallet signs TX
                       |
                       +----> Vault.mint() / Router.swap() --------> on-chain
                       |
                     (no API call -- EVM worker picks up event)
                       |
                     EVM Worker (120s) polls logs
                       |
                       +----> event mapper -> Outbox -> RabbitMQ
                       +----> PredictionMarketPolicy
                       +----> ProjectTrade command -> DB insert
                       |
                     React Query auto-refetch (staleTime: 30s)
                       |
                     UI updates with new position / probability

  RESOLVE FLOW (PM-11):
  ResolveModal -----> user wallet signs TX
                       |
                       +----> Governor.resolve() ------------------> on-chain
                       |
                     EVM Worker picks up ProposalResolved event
                       |
                       +----> ProjectResolution command -> DB update (resolved)
                       |
                     React Query refetch -> card shows winner

  REDEEM FLOW (PM-10, redeem tab):
  TradeModal -------> user wallet signs TX
                       |
                       +----> Vault.redeem() ----------------------> on-chain
                       |
                     EVM Worker picks up TokensRedeemed event
                       |
                       +----> ProjectTrade(redeem) -> DB update
```

---

### TICKET PM-11: Resolve Modal — TWAP Resolution

**Size:** S | **Depends on:** PM-7 | **Blocks:** PM-17

Resolution modal for thread author / community admin.

**Files to create:**

- `client/scripts/views/modals/prediction_market_resolve_modal.tsx`

**Acceptance criteria:**

- [ ] Current TWAP probability, TWAP window selector, predicted outcome
- [ ] "Resolve Market" triggers Governor.resolve() on-chain
- [ ] Only visible to thread author / community admin, only enabled after end_time

**Wireframe:**

```text
  +---------------------------------------+
  | Resolve: Will ETH reach $5k?         |
  |                                       |
  | Current TWAP Probability:            |
  |                                       |
  | PASS 73% █████████████░░░░░░░ FAIL   |
  |                                       |
  | Threshold: 55%                       |
  | Predicted outcome: PASS              |
  |                                       |
  | This will resolve the market and     |
  | allow winners to redeem tokens.      |
  |                                       |
  | [Cancel]        [Resolve Market]     |
  +---------------------------------------+
             |
             | Wallet TX: Governor.resolve()
             v
```

---

### TICKET PM-12: Explore Page — Tab + AllTabContent Section

**Size:** M | **Depends on:** PM-7 | **Blocks:** PM-17

Add prediction markets to the explore page alongside existing Markets tab.

**Files to create:**

- `client/scripts/views/pages/ExplorePage/PredictionMarketsList/PredictionMarketsList.tsx`

**Files to modify:**

- `client/scripts/views/pages/ExplorePage/ExplorePage.tsx` (add to TAB_VIEWS[])
- `client/scripts/views/pages/ExplorePage/AllTabContent/AllTabContent.tsx` (add section)

**Follows:** `client/scripts/views/pages/ExplorePage/MarketsList/MarketsList.tsx`

```typescript
// ExplorePage.tsx — add to TAB_VIEWS[] (like markets tab)
...(predictionMarketsEnabled
  ? [{ value: 'prediction-markets', label: 'Prediction Markets' }]
  : []),

// AllTabContent.tsx — add section (like Markets section)
{predictionMarketsEnabled && (
  <div className="section-container">
    <CWSectionHeader
      title="Prediction Markets"
      seeAllText="See all prediction markets"
      onSeeAllClick={() => navigate('/explore?tab=prediction-markets')}
    />
    <PredictionMarketsList hideHeader hideFilters />
  </div>
)}
```

**Acceptance criteria:**

- [ ] `PredictionMarketsList` component: filter by status, community, sort by volume/recency
- [ ] Uses `PredictionMarketCard` compact variant in horizontal scroll container
- [ ] Infinite scroll pagination on dedicated tab
- [ ] Search functionality in AllTabContent

**Wireframe:**

```text
  ExplorePage.tsx
  +================================================================+
  | [All] [Communities] [Users] [Contests] [Threads] [Quests]      |
  |       [Tokens] [Markets] [Prediction Markets]                  |
  |                           ^^^^^^^^^^^^^^^^^^^ NEW TAB          |
  +================================================================+

  --- "All" Tab (AllTabContent.tsx) ---
  +-----------------------------------------------------------------+
  | Communities                                    [See all >]      |
  | +----------+ +----------+ +----------+ +----------+   -->     |
  | | Comm 1   | | Comm 2   | | Comm 3   | | Comm 4   |          |
  | +----------+ +----------+ +----------+ +----------+           |
  |                                                                 |
  | Prediction Markets                             [See all >]      |
  | +----------+ +----------+ +----------+                    -->  |
  | |Will ETH  | |BTC $100k | |SOL flip  |                        |
  | |reach $5k?| |by 2026?  | |ETH?      |                        |
  | |PASS: 62% | |PASS: 45% | |PASS: 28% |                        |
  | |23d left  | |87d left  | |12d left  |                        |
  | +----------+ +----------+ +----------+                         |
  |         (compact PredictionMarketCard, 330px)                   |
  +-----------------------------------------------------------------+

  --- "Prediction Markets" Tab ---
  +-----------------------------------------------------------------+
  | Filters: [Status v] [Community v] [Sort: Volume v] [Search...] |
  |                                                                 |
  | +----------+ +----------+ +----------+ +----------+            |
  | |Will ETH  | |BTC $100k | |SOL flip  | |Will the  |           |
  | |reach $5k?| |by 2026?  | |ETH?      | |merge pass|           |
  | |PASS: 62% | |PASS: 45% | |PASS: 28% | |PASS: 81% |           |
  | |23d left  | |87d left  | |12d left  | |5d left   |           |
  | |12.4k USDC| |45.2k USDC| |3.1k USDC | |89k USDC  |           |
  | +----------+ +----------+ +----------+ +----------+            |
  |                                                                 |
  |                    [Load more...]                               |
  +-----------------------------------------------------------------+
```

---

### TICKET PM-13: Homepage + Community Homepage — Discovery Sections

**Size:** M | **Depends on:** PM-7 | **Blocks:** PM-17

Add prediction market discovery sections to both homepages.

**Files to create:**

- `client/scripts/views/pages/HomePage/ActivePredictionMarketList/ActivePredictionMarketList.tsx`
- `client/scripts/views/pages/HomePage/ActivePredictionMarketList/ActivePredictionMarketList.scss`

**Files to modify:**

- `client/scripts/views/pages/HomePage/HomePage.tsx` (add section)
- `client/scripts/views/pages/CommunityHome/CommunityHomePage.tsx` (add section)

**Follows:** `client/scripts/views/pages/HomePage/ActiveContestList/ActiveContestList.tsx`

```typescript
// HomePage.tsx — add between contests and threads
<ActivePredictionMarketList />

// CommunityHomePage.tsx — add with community filter
<ActivePredictionMarketList
  isCommunityHomePage
  communityIdFilter={chain}
/>
```

**Acceptance criteria:**

- [ ] `ActivePredictionMarketList` shows active markets sorted by volume/recency
- [ ] Compact `PredictionMarketCard` (330px) in horizontal scroll container
- [ ] "See all prediction markets" links to `/explore?tab=prediction-markets`
- [ ] Empty state handling (hide section if no active markets)
- [ ] `isCommunityHomePage` prop filters to community scope
- [ ] Loading skeletons match existing contest/quest card skeletons

**Wireframe:**

```text
  HomePage.tsx / CommunityHomePage.tsx
  +-----------------------------------------------------------------+
  | ...existing content...                                          |
  |                                                                 |
  | Active Contests                                [See all >]      |
  | +----------+ +----------+ +----------+                    -->  |
  | | Contest1 | | Contest2 | | Contest3 |                         |
  | +----------+ +----------+ +----------+                         |
  |                                                                 |
  | Prediction Markets                             [See all >]      |
  | +----------+ +----------+ +----------+                    -->  |
  | |Will ETH  | |BTC $100k | |SOL flip  |                        |
  | |reach $5k?| |by 2026?  | |ETH?      |                        |
  | |PASS: 62% | |PASS: 45% | |PASS: 28% |                        |
  | |23d left  | |87d left  | |12d left  |                        |
  | +----------+ +----------+ +----------+                         |
  |    ActivePredictionMarketList (horizontal scroll, compact)      |
  |                                                                 |
  | ...existing content (threads, quests, etc.)...                  |
  +-----------------------------------------------------------------+

  CommunityHomePage: same layout but filtered via communityIdFilter={chain}
```

---

### TICKET PM-14: Sidebar Navigation + Admin Settings Page

**Size:** M | **Depends on:** PM-7 | **Blocks:** PM-17

Sidebar nav entries and admin management page.

**Files to create:**

- `client/scripts/views/pages/CommunityManagement/PredictionMarkets/PredictionMarketsPage.tsx`
- `client/scripts/views/pages/PredictionMarketsAppPage.tsx`

**Files to modify:**

- `client/scripts/views/components/sidebar/governance_section.tsx` (add nav entry)
- `client/scripts/views/components/sidebar/AdminSection/AdminSection.tsx` (add admin nav)

**Follows:** `client/scripts/views/components/sidebar/governance_section.tsx` (Markets entry), `client/scripts/views/pages/CommunityManagement/Markets/MarketsPage.tsx`, `client/scripts/views/pages/MarketsAppPage.tsx`

```typescript
// governance_section.tsx — add menu item (like "Markets" entry)
...(predictionMarketsEnabled
  ? [{ type: 'default', label: 'Prediction Markets',
       to: `/${communityId}/prediction-markets` }]
  : []),

// AdminSection.tsx — add admin nav item
...(predictionMarketsEnabled
  ? [{ type: 'default', label: 'Prediction Markets',
       to: `/${communityId}/manage/prediction-markets` }]
  : []),
```

**Acceptance criteria:**

- [ ] Sidebar: "Prediction Markets" entry in Apps section alongside Contests, Markets, Quests
- [ ] Admin sidebar: "Prediction Markets" entry in admin section
- [ ] `PredictionMarketsPage.tsx` admin page: enable/disable for community, set default collateral token, set max duration
- [ ] `PredictionMarketsAppPage.tsx` app page: tabbed view ("Active", "My Positions", "Resolved") following `MarketsAppPage.tsx` pattern

**Wireframe — sidebar + admin + app page:**

```text
  Sidebar (governance_section.tsx)           Admin Sidebar (AdminSection.tsx)
  +----------------------------+            +----------------------------+
  | APPS                       |            | ADMIN                      |
  |                            |            |                            |
  |   Members                  |            |   Community Profile        |
  |   Governance               |            |   Integrations             |
  |   Proposals                |            |   Topics                   |
  |   Contests                 |            |   Contests                 |
  |   Quests                   |            |   Quests                   |
  |   Markets                  |            |   Market Integrations      |
  |   > Prediction Markets     |  <-- NEW   |   > Prediction Markets     |  <-- NEW
  |   Directory                |            |   Analytics                |
  +----------------------------+            +----------------------------+
                |                                        |
                v                                        v
  /:scope/prediction-markets            /:scope/manage/prediction-markets
  +----------------------------+        +----------------------------+
  | [Active] [My Pos.] [Done] |        | Prediction Markets Config  |
  |                            |        |                            |
  | +------------------------+ |        | Enable: [x] On  [ ] Off   |
  | | Will ETH reach $5k?   | |        | Collateral: [USDC v]      |
  | | PASS 62% ████████░ FAIL| |        | Max Duration: [90 days]   |
  | | 23d left  12.4k USDC  | |        +----------------------------+
  | +------------------------+ |
  | +------------------------+ |
  | | BTC to $100k by 2026? | |
  | | PASS 45% ██████░░ FAIL| |
  | | 87d left  45.2k USDC  | |
  | +------------------------+ |
  |                            |
  |     [Load more...]        |
  +----------------------------+

  --- "My Positions" Tab ---
  +----------------------------+
  | [Active] [My Pos.] [Done] |
  |          ==========        |
  | +------------------------+ |
  | | Will ETH reach $5k?   | |
  | | PASS 62% ████████░ FAIL| |
  | | Your position:         | |
  | |  148 PASS | 2 FAIL     | |
  | |  100 USDC in   [Trade] | |
  | +------------------------+ |
  +----------------------------+

  --- "Resolved" Tab ---
  +----------------------------+
  | [Active] [My Pos.] [Done] |
  |                    ======  |
  | +------------------------+ |
  | | Gas fees stay low?     | |
  | | [RESOLVED] PASS wins   | |
  | | PASS 88% ████████░ FAIL| |
  | |             [Redeem]   | |
  | +------------------------+ |
  +----------------------------+
```

---

### TICKET PM-15: Thread List Badge — Market Status Tag

**Size:** S | **Depends on:** PM-6 | **Blocks:** PM-17

Small tag on thread cards showing market status + probability.

**Files to create:**

- `client/scripts/views/components/ThreadPredictionMarketTag/ThreadPredictionMarketTag.tsx`

**Follows:** `client/scripts/views/components/ThreadContestTag/ThreadContestTag.tsx`

**Acceptance criteria:**

- [ ] `ThreadPredictionMarketTag` shows status + probability in compact popover
- [ ] Renders on thread cards in feed views when `thread.has_prediction_market === true`
- [ ] Green/red probability indicator
- [ ] Popover: market prompt, time remaining, total volume

**Wireframe:**

```text
  Thread Feed (ThreadCard)
  +-----------------------------------------------------------------+
  | +-- Thread Title Here ---------------------------------+        |
  | |                                                       |        |
  | | Thread preview text...                               |        |
  | |                                                       |        |
  | | [Governance]  [PASS 62%]   5 comments   2h ago       |        |
  | |                ^^^^^^^^^^                             |        |
  | |                ThreadPredictionMarketTag              |        |
  | +------------------------------------------------------+        |
  |                                                                 |
  | +-- Another Thread Without Market ---------------------+        |
  | |                                                       |        |
  | | Thread preview text...                               |        |
  | |                                                       |        |
  | | [Discussion]               12 comments   5h ago      |        |
  | +------------------------------------------------------+        |
  +-----------------------------------------------------------------+

  ThreadPredictionMarketTag -- popover on hover:
  +-------------------------------+
  | Will ETH reach $5k?          |
  | PASS 62% ████████░░░░░ FAIL  |
  | 23 days remaining            |
  | 12,450 USDC locked           |
  +-------------------------------+
```

---

### TICKET PM-16: Routing

**Size:** S | **Depends on:** PM-14 | **Blocks:** PM-17

Register all prediction market routes.

**Files to modify:**

- `client/scripts/navigation/CommonDomainRoutes.tsx`
- `client/scripts/navigation/CustomDomainRoutes.tsx`

**Follows:** existing Markets routes in same files

**Acceptance criteria:**

- [ ] `/:scope/prediction-markets` → `PredictionMarketsAppPage` (scoped)
- [ ] `/prediction-markets` → `PredictionMarketsAppPage` (common domain)
- [ ] `/:scope/manage/prediction-markets` → `PredictionMarketsPage` (admin)
- [ ] `/manage/prediction-markets` → `PredictionMarketsPage` (admin)
- [ ] All routes conditional on `predictionMarketsEnabled` flag

---

### TICKET PM-17: Feature Flag + Community Setting

**Size:** M | **Depends on:** PM-8 through PM-16 | **Blocks:** nothing

Feature flag and community-level configuration for prediction markets.

**Files to create:**

- `libs/schemas/src/entities/community-prediction-market-settings.schemas.ts` (or extend community schemas)

**Files to modify:**

- `packages/commonwealth/client/scripts/helpers/feature-flags.ts` (add `prediction_markets` flag)
- `packages/commonwealth/client/vite.config.ts` (expose `FLAG_PREDICTION_MARKETS`)
- `packages/commonwealth/server/config.ts` (add `FLAG_PREDICTION_MARKETS` env var)

**Acceptance criteria:**

- [ ] Feature flag `FLAG_PREDICTION_MARKETS` defined in `feature-flags.ts` using `buildFlag`
- [ ] Flag exposed in `vite.config.ts` for frontend access
- [ ] All PM UI surfaces gated by `useFlag('prediction_markets')`:
  - [ ] Thread sidebar card (ViewThreadPage)
  - [ ] Thread creation button (NewThreadForm)
  - [ ] Explore page tab + AllTabContent section
  - [ ] Homepage + Community homepage sections
  - [ ] Sidebar navigation entries (governance + admin)
  - [ ] Routing (CommonDomainRoutes + CustomDomainRoutes)
  - [ ] Admin settings page
  - [ ] App page
  - [ ] Thread list badge/tag
- [ ] API routes still functional when flag is off (flag only gates UI, not backend)
- [ ] Community-level setting: admin can enable/disable prediction markets per community
- [ ] Default collateral token configurable per community (USDC default)
- [ ] Flag togglable per environment (dev/staging/prod)

---

### TICKET PM-18: Testing + QA

**Size:** L | **Depends on:** PM-1 through PM-17 | **Blocks:** nothing

Covers all frontend surface testing in addition to existing backend test plan above.

**Frontend-specific tests:**

- [ ] PredictionMarketCard renders all states (draft/active/resolved/cancelled)
- [ ] Probability bar proportional fill matches data
- [ ] Editor modal validates inputs and triggers wallet TX
- [ ] Trade modal tabs enable/disable by market status
- [ ] Resolve modal only visible to authorized users after end_time
- [ ] Explore page tab appears only when flag enabled
- [ ] Homepage sections hide when no active markets
- [ ] Sidebar nav entries gated by feature flag
- [ ] Thread badge renders on correct threads
- [ ] All routes resolve correctly
- [ ] Feature flag off hides all UI surfaces
- [ ] Community setting respected per-community

---

### Frontend Dependency Graph (PM-7 through PM-18)

```text
  PM-6 (React Query Hooks)
    |
    +-------> PM-7 (Card Component)
    |            |
    |            +---> PM-8  (Thread View)
    |            +---> PM-9  (Editor Modal)
    |            +---> PM-10 (Trade Modal)
    |            +---> PM-11 (Resolve Modal)
    |            +---> PM-12 (Explore Page)
    |            +---> PM-13 (Homepages)
    |            +---> PM-14 (Sidebar + Admin)
    |            |        |
    |            |        +---> PM-16 (Routing)
    |            |
    +-------> PM-15 (Thread Badge — only needs PM-6)
                                   |
              PM-8..PM-16 --------+
                                   v
                                PM-17 (Feature Flag)
                                   |
                                   v
                                PM-18 (Testing)
```

**Parallelizable:** PM-8 through PM-15 can ALL run in parallel after PM-7 (each is an independent surface). PM-15 only needs PM-6, not PM-7 — can start earlier.

### Frontend Key Patterns to Reuse

| Pattern | Source File | Reuse For |
|---------|------------|-----------|
| Poll React Query hooks | `client/scripts/state/api/polls/` | PM React Query hooks |
| ThreadPollCard → PollCard | `client/scripts/views/pages/view_thread/ThreadPollCard.tsx` | ThreadPredictionMarketCard → PredictionMarketCard |
| Poll editor modal | `client/scripts/views/modals/poll_editor_modal.tsx` | PM editor modal |
| ThreadPollEditorCard | `client/scripts/views/pages/view_thread/ThreadPollEditorCard.tsx` | ThreadPredictionMarketEditorCard (AI generation) |
| ActiveContestList | `client/scripts/views/pages/HomePage/ActiveContestList/ActiveContestList.tsx` | ActivePredictionMarketList (homepage sections) |
| XpQuestList | `client/scripts/views/pages/HomePage/XpQuestList/XpQuestList.tsx` | ActivePredictionMarketList (communityIdFilter prop) |
| MarketsList | `client/scripts/views/pages/ExplorePage/MarketsList/MarketsList.tsx` | PredictionMarketsList (explore tab + filters) |
| AllTabContent section | `client/scripts/views/pages/ExplorePage/AllTabContent/AllTabContent.tsx` | PM section with CWSectionHeader + horizontal scroll |
| MarketsAppPage | `client/scripts/views/pages/MarketsAppPage.tsx` | PredictionMarketsAppPage (tabbed app view) |
| Markets admin page | `client/scripts/views/pages/CommunityManagement/Markets/MarketsPage.tsx` | PredictionMarketsPage (admin settings) |
| ThreadContestTag | `client/scripts/views/components/ThreadContestTag/ThreadContestTag.tsx` | ThreadPredictionMarketTag (thread list badge) |
| ThreadTokenDrawer | `client/scripts/views/components/ThreadTokenDrawer/ThreadTokenDrawer.tsx` | Trade activity drawer (TradeActivityTab pattern) |
| Sidebar nav entry | `client/scripts/views/components/sidebar/governance_section.tsx` | PM nav entry (gated by feature flag) |
| Admin sidebar entry | `client/scripts/views/components/sidebar/AdminSection/AdminSection.tsx` | PM admin nav entry |
| CWContentPageCard | `client/scripts/views/components/component_kit/CWContentPageCard/` | Thread sidebar wrapper (collapsible card) |
| CWSectionHeader | `component_kit` | Homepage/explore section headers with "See all" link |
| Feature flag pattern | `client/scripts/helpers/feature-flags.ts` → `useFlag('markets')` | `useFlag('prediction_markets')` |

### Visual Diagrams (FigJam)

- **[Event Storming Model](https://www.figma.com/online-whiteboard/create-diagram/61090bc5-253e-41c6-a038-01aa15ab6660)** -- Full domain flow: actors, commands, on-chain TX, domain events, outbox/relay, policies, system commands, read models
- **[Lifecycle State Machine](https://www.figma.com/online-whiteboard/create-diagram/9cde7256-9576-4e70-b8ab-436f8a1f4be9)** -- Market states: Draft -> Active -> Resolved/Cancelled with transitions

---

## Testing & Integration Tickets (PM-19 through PM-25)

Expands on PM-18 and the Detailed Test Plan above with concrete test files, patterns, setup code, and acceptance criteria aligned with the existing Commonwealth testing infrastructure.

### Testing Infrastructure Summary

```text
  Test Layer         Framework       Location                             Pattern Reference
  ──────────         ─────────       ────────                             ─────────────────
  Unit (model)       Vitest          libs/model/test/prediction-market/   contest/, poll tests
  Unit (frontend)    Vitest          packages/commonwealth/test/unit/     state/sidebar.spec.ts
  Integration (API)  Vitest          test/integration/api/                polls.spec.ts
  Integration (CE)   Vitest          test/integration/chain-events/       evmChainEvents.spec.ts
  Devnet (EVM)       Vitest+Anvil    test/devnet/evm/                     evmChainEvents.spec.ts
  E2E (browser)      Playwright      test/e2e/e2eRegular/                 newDiscussion.spec.ts
  E2E (stateful)     Playwright      test/e2e/e2eStateful/                (pre-seeded scenarios)
```

### Testing Dependency Graph

```text
  Backend Tests                         Frontend Tests
  ═════════════                         ══════════════

  PM-19 (Unit: Schemas+Models)          PM-24 (Unit: FE Utils+Stores)
    |                                     |
    v                                     |
  PM-20 (Unit: Commands+Queries)          |
    |                                     |
    +--------+                            |
    |        |                            |
    v        v                            |
  PM-21    PM-22                          |
  (API)    (Chain Events)                 |
    |        |                            |
    |        v                            |
    |      PM-23 (Devnet)                 |
    |        |                            |
    +--------+----------------------------+
             |
             v
           PM-25 (E2E: Playwright)
```

**Parallelizable:**
- PM-19 + PM-24 can start simultaneously (no overlap)
- PM-21 + PM-22 can run in parallel (both depend on PM-20)
- PM-23 depends on PM-22 (needs mappers + policy verified first)
- PM-25 is the integration point — needs all others complete

---

### TICKET PM-19: Unit Tests — Schemas + Models

**Size:** S | **Depends on:** PM-1, PM-2 | **Blocks:** PM-20

Validate Zod schemas, Sequelize model creation, associations, and constraints.

**Files to create:**
- `libs/model/test/prediction-market/schemas.spec.ts`
- `libs/model/test/prediction-market/models.spec.ts`

**Follows pattern:** `libs/model/test/contest/check-contests.spec.ts` (seed-based model tests)

**Setup pattern:**
```typescript
import { dispose } from '@hicommonwealth/core';
import { seed } from '@hicommonwealth/model/tester';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('PredictionMarket schemas', () => {
  afterAll(async () => { await dispose()(); });
  // ...
});
```

**Test cases — schemas.spec.ts:**

| # | Test | Input | Expected |
|---|------|-------|----------|
| 1 | Valid PredictionMarket entity | All required fields, status='draft' | Parses without error |
| 2 | Invalid status enum | status='pending' | Zod throws validation error |
| 3 | Invalid action enum | action='buy' | Zod throws validation error |
| 4 | Valid CreatePredictionMarket command | prompt, collateral, duration, threshold | Parses without error |
| 5 | Missing required prompt | omit prompt field | Zod throws validation error |
| 6 | Duration out of range | duration=0 | Zod throws validation error |
| 7 | Threshold boundaries | threshold=0.50 (below 0.51) | Zod throws validation error |
| 8 | Threshold boundaries | threshold=0.55 (valid) | Parses without error |
| 9 | Valid DeployPredictionMarket command | All on-chain addresses (0x-prefixed) | Parses without error |
| 10 | Valid trade entity | Composite key (eth_chain_id + tx_hash) | Parses without error |
| 11 | Valid position entity | prediction_market_id + user_address | Parses without error |
| 12 | Query schemas | GetPredictionMarkets with thread_id | Parses without error |

**Test cases — models.spec.ts:**

| # | Test | What it validates |
|---|------|-------------------|
| 1 | Create PredictionMarket via seed | `seed('PredictionMarket', {...})` returns valid record |
| 2 | Association: PM belongs to Thread | `pm.thread_id` FK resolves |
| 3 | Association: PM belongs to Community | `pm.community_id` FK resolves |
| 4 | Association: PM has many Trades | Can create trades linked to PM |
| 5 | Association: PM has many Positions | Can create positions linked to PM |
| 6 | Unique constraint: Position | Duplicate (prediction_market_id, user_address) throws |
| 7 | Composite PK: Trade | Duplicate (eth_chain_id, tx_hash) throws |
| 8 | DECIMAL(78,0) precision | Large uint256 values stored without truncation |
| 9 | Thread.has_prediction_market column | Boolean defaults to false |
| 10 | ON DELETE behavior | Deleting PM cascades or restricts trades/positions as designed |

**Acceptance criteria:**
- [ ] All 22 test cases pass
- [ ] Schema validation covers all enum values (status, action, winner)
- [ ] Model tests use `seed()` from `@hicommonwealth/model/tester`
- [ ] No database state leaks between tests

---

### TICKET PM-20: Unit Tests — Commands + Queries (Aggregates)

**Size:** M | **Depends on:** PM-3, PM-19 | **Blocks:** PM-21, PM-22

Test all prediction market commands and queries using the `command()` / `query()` pattern.

**Files to create:**
- `libs/model/test/prediction-market/CreatePredictionMarket.spec.ts`
- `libs/model/test/prediction-market/DeployPredictionMarket.spec.ts`
- `libs/model/test/prediction-market/ResolvePredictionMarket.spec.ts`
- `libs/model/test/prediction-market/CancelPredictionMarket.spec.ts`
- `libs/model/test/prediction-market/ProjectTrade.spec.ts`
- `libs/model/test/prediction-market/ProjectResolution.spec.ts`
- `libs/model/test/prediction-market/GetPredictionMarkets.spec.ts`

**Follows pattern:** `libs/model/test/contest/check-contests.spec.ts`, `test/integration/api/polls.spec.ts`

**Setup pattern:**
```typescript
import { command, dispose, query } from '@hicommonwealth/core';
import { PredictionMarket } from '@hicommonwealth/model';
import { seed } from '@hicommonwealth/model/tester';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('CreatePredictionMarket', () => {
  let communityId: string;
  let threadId: number;
  let userId: number;
  let address: string;

  beforeAll(async () => {
    const [chainNode] = await seed('ChainNode');
    const [user] = await seed('User', { isAdmin: false });
    const [community] = await seed('Community', {
      chain_node_id: chainNode!.id,
      Addresses: [{ user_id: user!.id, address: '0x...', role: 'member' }],
      topics: [{ name: 'general' }],
    });
    // Create thread owned by user
    // ...
  });

  afterAll(async () => { await dispose()(); });
});
```

**Test cases — CreatePredictionMarket.spec.ts:**

| # | Test | Actor | Payload | Expected |
|---|------|-------|---------|----------|
| 1 | Success: thread author creates PM | thread author | valid prompt/collateral/duration | PM record created, status=draft |
| 2 | Sets thread.has_prediction_market | thread author | valid | Thread updated to has_prediction_market=true |
| 3 | Auth: non-author rejected | different user | valid | Throws unauthorized |
| 4 | Auth: admin can create | community admin | valid | PM record created |
| 5 | Duplicate: thread already has PM | thread author | second create on same thread | Throws conflict/validation error |
| 6 | Validation: missing prompt | thread author | omit prompt | Throws validation error |

**Test cases — DeployPredictionMarket.spec.ts:**

| # | Test | Pre-state | Payload | Expected |
|---|------|-----------|---------|----------|
| 1 | Success: draft -> active | status=draft | All on-chain addresses | status=active, start_time set |
| 2 | Invalid transition: cancelled -> active | status=cancelled | addresses | Throws invalid state |
| 3 | Invalid transition: resolved -> active | status=resolved | addresses | Throws invalid state |
| 4 | Stores all contract addresses | status=draft | vault, governor, router, strategy, tokens | All fields populated |

**Test cases — ResolvePredictionMarket.spec.ts:**

| # | Test | Actor | Pre-state | Expected |
|---|------|-------|-----------|----------|
| 1 | Success: author resolves PASS | thread author | active | status=resolved, winner=1 |
| 2 | Success: author resolves FAIL | thread author | active | status=resolved, winner=2 |
| 3 | Auth: non-author rejected | random user | active | Throws unauthorized |
| 4 | Auth: admin can resolve | community admin | active | status=resolved |
| 5 | Invalid: already resolved | author | resolved | Throws invalid state |
| 6 | Invalid: draft cannot resolve | author | draft | Throws invalid state |
| 7 | Sets resolved_at timestamp | author | active | resolved_at is not null |

**Test cases — CancelPredictionMarket.spec.ts:**

| # | Test | Actor | Pre-state | Expected |
|---|------|-------|-----------|----------|
| 1 | Cancel draft | author | draft | status=cancelled |
| 2 | Cancel active | author | active | status=cancelled |
| 3 | Cannot cancel resolved | author | resolved | Throws invalid state |
| 4 | Auth: non-author rejected | random user | active | Throws unauthorized |

**Test cases — ProjectTrade.spec.ts:**

| # | Test | Action | Token amounts | Expected position |
|---|------|--------|---------------|-------------------|
| 1 | Mint: first trade creates position | mint | collateral=100 | p:100, f:100, collateral_in:100 |
| 2 | Mint: second mint adds to position | mint | collateral=50 | p:150, f:150, collateral_in:150 |
| 3 | Swap buy PASS | swap_buy_pass | f_in=50, p_out=52 | p:202, f:100, collateral_in:150 |
| 4 | Swap buy FAIL | swap_buy_fail | p_in=30, f_out=31 | p:172, f:131, collateral_in:150 |
| 5 | Merge | merge | amount=50 | p:122, f:81, collateral_in:100 |
| 6 | Redeem (after resolve) | redeem | p_in=122 | p:0, f:81, collateral_in:100 |
| 7 | Trade record created | mint | any | PredictionMarketTrade row exists |
| 8 | Updates total_collateral on PM | mint | collateral=100 | PM.total_collateral += 100 |
| 9 | Idempotency: duplicate tx_hash | mint | same tx_hash | Throws composite PK violation |

**Test cases — ProjectResolution.spec.ts:**

| # | Test | Event data | Expected |
|---|------|------------|----------|
| 1 | MarketResolved: PASS wins | winner=1 | status=resolved, winner=1 |
| 2 | MarketResolved: FAIL wins | winner=2 | status=resolved, winner=2 |
| 3 | Sets resolved_at | any | resolved_at timestamp set |
| 4 | Idempotent: already resolved | winner=1 on resolved market | No error, no change |

**Test cases — GetPredictionMarkets.spec.ts:**

| # | Test | Params | Expected |
|---|------|--------|----------|
| 1 | Returns markets for thread | thread_id with 1 market | Array of length 1 |
| 2 | Empty for thread without markets | thread_id with no PM | Empty array |
| 3 | Includes positions | thread_id with PM + positions | Eager-loaded positions |
| 4 | Includes trades (paginated) | market_id + page params | Paginated trade list |

**Acceptance criteria:**
- [ ] All ~35 test cases pass
- [ ] Commands tested via `command(PredictionMarket.CreatePredictionMarket(), {...})`
- [ ] Queries tested via `query(PredictionMarket.GetPredictionMarkets(), {...})`
- [ ] State machine transitions exhaustively tested (all valid + all invalid)
- [ ] Position balance arithmetic verified for all action types

---

### TICKET PM-21: Integration Tests — API Routes (tRPC)

**Size:** M | **Depends on:** PM-4, PM-20 | **Blocks:** PM-25

End-to-end API integration tests hitting real tRPC endpoints with a test server.

**Files to create:**
- `packages/commonwealth/test/integration/api/prediction-markets.spec.ts`

**Follows pattern:** `packages/commonwealth/test/integration/api/polls.spec.ts`

**Setup pattern:**
```typescript
import { command, dispose, query } from '@hicommonwealth/core';
import { PredictionMarket } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

describe('Prediction Markets API', () => {
  let server: TestServer;
  let authorJWT: string;
  let authorUserId: number;
  let authorAddress: string;
  let nonAuthorJWT: string;
  let threadId: number;
  let topicId: number;

  beforeAll(async () => {
    server = await testServer();
    const topic = await models.Topic.findOne({
      where: { community_id: 'ethereum' },
    });
    topicId = topic!.id;

    // Create thread author
    const authorRes = await server.seeder.createAndVerifyAddress(
      { chain: 'ethereum' }, 'Alice',
    );
    authorAddress = authorRes.address;
    authorUserId = parseInt(authorRes.user_id);
    authorJWT = jwt.sign(
      { id: authorRes.user_id, email: authorRes.email },
      config.AUTH.JWT_SECRET,
    );

    // Create non-author user
    const nonAuthorRes = await server.seeder.createAndVerifyAddress(
      { chain: 'ethereum' }, 'Bob',
    );
    nonAuthorJWT = jwt.sign(
      { id: nonAuthorRes.user_id, email: nonAuthorRes.email },
      config.AUTH.JWT_SECRET,
    );

    // Create thread owned by author
    const threadRes = await server.seeder.createThread({
      chainId: 'ethereum', address: authorAddress, jwt: authorJWT,
      title: 'PM Test Thread', body: 'Test body', topicId, kind: 'discussion',
    });
    threadId = threadRes.result!.id;
  });

  afterAll(async () => { await dispose()(); });
});
```

**Test cases:**

```text
  Full Lifecycle Flow
  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  │  1. createPredictionMarket (author) ──→ returns PM with         │
  │     status=draft, prompt, thread_id                             │
  │                                                                 │
  │  2. getPredictionMarkets(thread_id) ──→ returns [PM]            │
  │                                                                 │
  │  3. deployPredictionMarket (author) ──→ updates to              │
  │     status=active, all addresses set                            │
  │                                                                 │
  │  4. getPredictionMarkets(thread_id) ──→ PM.status=active        │
  │                                                                 │
  │  5. Mock: ProjectPredictionMarketTrade (system) ──→             │
  │     creates Trade + Position records                            │
  │                                                                 │
  │  6. getPredictionMarketTrades(market_id) ──→ trade history      │
  │                                                                 │
  │  7. getPredictionMarketPositions(market_id) ──→ positions       │
  │                                                                 │
  │  8. resolvePredictionMarket (author, winner=1) ──→              │
  │     status=resolved, winner=1                                   │
  │                                                                 │
  │  9. getPredictionMarkets(thread_id) ──→ PM.status=resolved      │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

| # | Test | Actor | Method | Expected |
|---|------|-------|--------|----------|
| 1 | Create PM — success | author | createPredictionMarket | 200, PM with status=draft |
| 2 | Create PM — non-author rejected | nonAuthor | createPredictionMarket | 401/403 |
| 3 | Create PM — unauthenticated | none | createPredictionMarket | 401 |
| 4 | Deploy PM — success | author | deployPredictionMarket | 200, status=active |
| 5 | Get PMs — returns market | any | getPredictionMarkets | Array with 1 PM |
| 6 | Get PMs — empty for unknown thread | any | getPredictionMarkets | Empty array |
| 7 | Project trade — creates trade + position | system | command(ProjectTrade) | Trade + Position in DB |
| 8 | Get trades — returns history | any | getPredictionMarketTrades | Array with trades |
| 9 | Get positions — returns balances | any | getPredictionMarketPositions | Array with positions |
| 10 | Resolve PM — success | author | resolvePredictionMarket | 200, status=resolved |
| 11 | Resolve PM — non-author rejected | nonAuthor | resolvePredictionMarket | 401/403 |
| 12 | Cancel PM — success (draft) | author | cancelPredictionMarket | 200, status=cancelled |
| 13 | Cancel PM — already resolved rejected | author | cancelPredictionMarket | 400/409 |

**Acceptance criteria:**
- [ ] Full lifecycle test passes (create -> deploy -> trade -> query -> resolve)
- [ ] All auth enforcement tests pass
- [ ] Uses `testServer()` and `modelSeeder` patterns
- [ ] Test DB cleaned up in afterAll
- [ ] `pnpm -F commonwealth test-integration` includes these tests

---

### TICKET PM-22: Integration Tests — Chain Events Pipeline

**Size:** L | **Depends on:** PM-5, PM-6, PM-20 | **Blocks:** PM-23

Test the full chain events pipeline: raw EVM logs -> mapper -> outbox -> policy -> DB state.

**Files to create:**
- `packages/commonwealth/test/integration/chain-events/prediction-market-events.spec.ts`
- `libs/model/test/prediction-market/EventMappers.spec.ts`
- `libs/model/test/prediction-market/Policy.spec.ts`

**Follows pattern:** `packages/commonwealth/test/devnet/evm/evmChainEvents.spec.ts`, `libs/model/test/utils/outbox-drain.ts`

**Test flow diagram:**

```text
  Raw Log Hex        Event Mapper           Outbox              Policy              DB State
  ════════════       ════════════           ══════              ══════              ════════
  ┌───────────┐      ┌──────────┐      ┌──────────┐      ┌──────────────┐     ┌────────────┐
  │ topics[0] │ ──→  │ decode   │ ──→  │ emit to  │ ──→  │ PredictionMkt│ ──→ │ Trade row  │
  │ topics[1] │      │ with ABI │      │ Outbox   │      │ Policy       │     │ Position   │
  │ data      │      │          │      │          │      │ handler      │     │ PM update  │
  └───────────┘      └──────────┘      └──────────┘      └──────────────┘     └────────────┘
```

**Test cases — EventMappers.spec.ts (8 mappers):**

| # | Event | Raw log input | Expected decoded output |
|---|-------|---------------|-------------------------|
| 1 | ProposalCreated | topics: [sig, proposalId], data: [vault, governor, ...] | { proposalId, vaultAddress, governorAddress, ... } |
| 2 | MarketCreated | topics: [sig, marketId], data: [pToken, fToken, ...] | { marketId, pTokenAddress, fTokenAddress, ... } |
| 3 | TokensMinted | topics: [sig, marketId, user], data: [amount] | { marketId, user, collateralAmount, pAmount, fAmount } |
| 4 | TokensMerged | topics: [sig, marketId, user], data: [amount] | { marketId, user, amount } |
| 5 | SwapExecuted | topics: [sig, marketId, user], data: [buyPass, amtIn, amtOut] | { marketId, user, buyPass, amountIn, amountOut } |
| 6 | TokensRedeemed | topics: [sig, marketId, user], data: [amount] | { marketId, user, amount } |
| 7 | MarketResolved | topics: [sig, marketId], data: [winner] | { marketId, winner } |
| 8 | ProposalResolved | topics: [sig, proposalId], data: [winner] | { proposalId, winner } |

**Test cases — Policy.spec.ts:**

| # | Event in | Command dispatched | DB assertion |
|---|----------|--------------------|--------------|
| 1 | PredictionMarketProposalCreated | Link addresses to PM record | PM.vault_address, governor_address etc. set |
| 2 | PredictionMarketMarketCreated | Verify/link market | PM.market_id, p_token, f_token set |
| 3 | PredictionMarketTokensMinted | ProjectTrade(action=mint) | Trade row + Position(p+, f+) created |
| 4 | PredictionMarketTokensMerged | ProjectTrade(action=merge) | Trade row + Position(p-, f-) updated |
| 5 | PredictionMarketSwapExecuted (buyPass=true) | ProjectTrade(action=swap_buy_pass) | Trade row + Position(p+, f-) |
| 6 | PredictionMarketSwapExecuted (buyPass=false) | ProjectTrade(action=swap_buy_fail) | Trade row + Position(p-, f+) |
| 7 | PredictionMarketTokensRedeemed | ProjectTrade(action=redeem) | Trade row + Position(winning token -) |
| 8 | PredictionMarketMarketResolved | ProjectResolution(winner=N) | PM.status=resolved, winner=N |
| 9 | PredictionMarketProposalResolved | ProjectResolution(winner=N) | PM.status=resolved, winner=N |
| 10 | Duplicate event (idempotency) | Same tx_hash twice | Second insert throws, no duplicate |

**Test cases — prediction-market-events.spec.ts (full pipeline):**

| # | Test | What it validates |
|---|------|-------------------|
| 1 | Full mint pipeline | Raw log -> mapper -> outbox -> drainOutbox -> policy -> verify Trade + Position in DB |
| 2 | Full swap pipeline | Raw swap log -> ... -> verify position balances updated |
| 3 | Full resolution pipeline | Raw MarketResolved log -> ... -> verify PM.status=resolved |
| 4 | Multi-event sequence | Mint -> Swap -> Swap -> Resolve in order -> final state correct |
| 5 | Mapper registry lookup | Event signature hash resolves to correct mapper function |
| 6 | Unknown event ignored | Random log topic -> no mapper found -> no error |

**Setup pattern (outbox drain):**
```typescript
import { emitEvent } from '@hicommonwealth/model';
import { drainOutbox } from '../../utils/outbox-drain';
import { models } from '@hicommonwealth/model/db';

// Emit event to outbox
await emitEvent(models.Outbox, [{
  event_name: 'PredictionMarketSwapExecuted',
  event_payload: {
    marketId: '0xabc...',
    user: '0x123...',
    buyPass: true,
    amountIn: '50000000000000000000',
    amountOut: '52000000000000000000',
  },
}]);

// Drain outbox through policy
await drainOutbox(
  ['PredictionMarketSwapExecuted'],
  PredictionMarketPolicy,
);

// Verify DB state
const trade = await models.PredictionMarketTrade.findOne({
  where: { transaction_hash: '0x...' },
});
expect(trade).to.not.be.null;
expect(trade!.action).to.equal('swap_buy_pass');
```

**Acceptance criteria:**
- [ ] All 8 event mappers tested with hex-encoded raw logs
- [ ] All 10 policy handler cases pass
- [ ] Full pipeline tests (6 cases) verify end-to-end from raw log to DB state
- [ ] Idempotency verified (composite PK prevents duplicate trades)
- [ ] Event signature hashes verified against keccak256 of Solidity signatures
- [ ] `pnpm -F commonwealth test-integration` includes these tests

---

### TICKET PM-23: Devnet Tests — On-Chain Contract Integration

**Size:** XL | **Depends on:** PM-5, PM-22 | **Blocks:** PM-25

Test actual contract interactions on a local Anvil fork, verifying the full on-chain lifecycle and chain event processing round-trip.

**Files to create:**
- `packages/commonwealth/test/devnet/evm/predictionMarket.spec.ts`

**Follows pattern:** `packages/commonwealth/test/devnet/evm/evmChainEvents.spec.ts`

**Setup pattern:**
```typescript
import { dispose } from '@hicommonwealth/core';
import {
  EvmEventSignatures,
  ValidChains,
  getBlockNumber,
} from '@hicommonwealth/evm-protocols';
import { getAnvil, localRpc, mineBlocks } from '@hicommonwealth/evm-testing';
import { Anvil } from '@viem/anvil';
import { createPublicClient, createWalletClient, http } from 'viem';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

describe('Prediction Market Devnet Tests', () => {
  let anvil: Anvil | undefined;
  let publicClient: ReturnType<typeof createPublicClient>;
  let walletClient: ReturnType<typeof createWalletClient>;
  let vaultAddress: `0x${string}`;
  let governorAddress: `0x${string}`;
  let routerAddress: `0x${string}`;

  beforeAll(async () => {
    anvil = await getAnvil(ValidChains.SepoliaBase);
    publicClient = createPublicClient({ transport: http(localRpc) });
    walletClient = createWalletClient({ transport: http(localRpc) });
    // Deploy prediction market contracts via helpers or scripts
  });

  afterAll(async () => {
    await anvil?.stop();
    await dispose()();
  });
});
```

**Test flow:**

```text
  Anvil Local Chain                    Test Assertions
  ═════════════════                    ════════════════

  1. Deploy contracts
     BinaryVault ──────────────────→  vaultAddress is valid contract
     FutarchyGovernor ─────────────→  governorAddress is valid contract
     FutarchyRouter ───────────────→  routerAddress is valid contract
     UniswapV3Strategy ────────────→  strategyAddress is valid contract

  2. Create proposal
     Governor.propose() ───────────→  ProposalCreated event emitted
                                      proposalId is bytes32

  3. Mint tokens
     Vault.mint(100 USDC) ─────────→  TokensMinted event emitted
     Check balances ────────────────→  pToken.balanceOf(user) == 100
                                      fToken.balanceOf(user) == 100

  4. Swap tokens
     Router.swap(buyPass=true, 50) ─→  SwapExecuted event emitted
     Check balances ────────────────→  pToken balance increased
                                      fToken balance decreased by 50

  5. Merge tokens
     Vault.merge(30) ──────────────→  TokensMerged event emitted
     Check balances ────────────────→  Both tokens decreased by 30
                                      Collateral returned

  6. Mine blocks to end_time
     mineBlocks(N) ────────────────→  Block timestamp > end_time

  7. Resolve
     Governor.resolve() ───────────→  ProposalResolved event emitted
                                      Winner determined by TWAP

  8. Redeem
     Vault.redeem(winningTokens) ──→  TokensRedeemed event emitted
                                      Collateral returned to user

  9. Event processing round-trip
     getLogs() for all events ──────→  8 event types captured
     Pass through mappers ─────────→  All decode correctly
     Feed through policy ──────────→  DB state matches chain state
```

**Test cases:**

| # | Test | On-chain action | Assertion |
|---|------|-----------------|-----------|
| 1 | Deploy contracts | Deploy full suite | All 4 contracts deployed, addresses valid |
| 2 | Create proposal | Governor.propose(prompt, collateral, duration, threshold) | ProposalCreated log emitted, proposalId non-zero |
| 3 | Create market | Vault.createMarket(...) | MarketCreated log, pToken + fToken deployed |
| 4 | Mint tokens | Vault.mint(100e18) | TokensMinted log, balances == 100e18 each |
| 5 | Swap buy PASS | Router.swap(buyPass=true, 50e18) | SwapExecuted log, pToken balance up, fToken down |
| 6 | Swap buy FAIL | Router.swap(buyPass=false, 20e18) | SwapExecuted log, fToken balance up, pToken down |
| 7 | Merge tokens | Vault.merge(10e18) | TokensMerged log, both tokens down, collateral returned |
| 8 | Get current probability | Strategy.getCurrentProbability() | Returns value between 0 and 1e18 |
| 9 | Mine past end_time | mineBlocks to future | Block timestamp > proposal end_time |
| 10 | Resolve proposal | Governor.resolve() | ProposalResolved log, winner != 0 |
| 11 | Redeem winning tokens | Vault.redeem(amount) | TokensRedeemed log, collateral received |
| 12 | getLogs captures all events | getLogs with block range | All 8 event types present |
| 13 | Event mappers decode all | Pass raw logs to mappers | All decode without error |
| 14 | Policy processes all | drainOutbox for all events | DB state: PM active->resolved, trades + positions correct |
| 15 | Probability matches chain | Compare DB current_probability to chain | Values match within tolerance |

**Acceptance criteria:**
- [ ] Full lifecycle test passes on local Anvil
- [ ] All 8 event types emitted and captured from real contract calls
- [ ] Event mappers verified against actual ABI-encoded log data (not mocked hex)
- [ ] Chain state (balances, probability, winner) matches expected values
- [ ] DB state matches chain state after policy processing
- [ ] Uses `getAnvil(ValidChains.SepoliaBase)` for chain fork
- [ ] `pnpm -F commonwealth test-devnet` includes this test (or similar command)

---

### TICKET PM-24: Unit Tests — Frontend Utilities + Stores

**Size:** S | **Depends on:** PM-6, PM-7 | **Blocks:** PM-25

Test frontend utility functions, formatting helpers, and any Zustand stores for prediction markets.

**Files to create:**
- `packages/commonwealth/test/unit/prediction-markets/utils.spec.ts`
- `packages/commonwealth/test/unit/prediction-markets/stores.spec.ts` (if applicable)

**Follows pattern:** `packages/commonwealth/test/unit/state/sidebar.spec.ts`, `packages/commonwealth/test/unit/market_integrations/getExternalMarketUrl.spec.ts`

**Test cases — utils.spec.ts:**

| # | Utility function | Input | Expected output |
|---|------------------|-------|-----------------|
| 1 | formatProbability | 0.55 | "55%" |
| 2 | formatProbability | 0 | "0%" |
| 3 | formatProbability | 1 | "100%" |
| 4 | formatProbability | 0.5555 | "55.6%" (1 decimal) |
| 5 | formatCollateral | 1000000n (USDC 6 decimals) | "1.00 USDC" |
| 6 | formatCollateral | 1000000000000000000n (WETH 18 decimals) | "1.00 WETH" |
| 7 | formatTimeRemaining | end_time 1 hour from now | "1h remaining" |
| 8 | formatTimeRemaining | end_time in past | "Ended" |
| 9 | calculateSlippage | amount=100, slippage=0.01 | { minOutput: 99, maxInput: 101 } |
| 10 | getMarketStatusColor | 'draft' | 'gray' |
| 11 | getMarketStatusColor | 'active' | 'blue' |
| 12 | getMarketStatusColor | 'resolved' | 'green' or 'red' depending on winner |
| 13 | getMarketStatusColor | 'cancelled' | 'gray' |
| 14 | canUserTrade | status='active', connected=true | true |
| 15 | canUserTrade | status='resolved', connected=true | false (only redeem) |
| 16 | canUserTrade | status='active', connected=false | false |
| 17 | getWinnerLabel | winner=1 | 'PASS' |
| 18 | getWinnerLabel | winner=2 | 'FAIL' |
| 19 | getWinnerLabel | winner=0 | null (not resolved) |

**Test cases — stores.spec.ts (if Zustand store created):**

| # | Store action | Initial state | Expected state |
|---|-------------|---------------|----------------|
| 1 | setSelectedTab('swap') | tab='mint' | tab='swap' |
| 2 | setSlippage(0.005) | slippage=0.01 | slippage=0.005 |
| 3 | setAmount('100') | amount='' | amount='100' |
| 4 | resetTradeForm | any | all defaults |

**Acceptance criteria:**
- [ ] All utility function tests pass
- [ ] Edge cases covered (zero values, null/undefined, past times)
- [ ] Store tests verify state transitions
- [ ] No async calls or API mocking needed (pure unit tests)
- [ ] `pnpm -F commonwealth test-unit` includes these tests

---

### TICKET PM-25: E2E Tests — Browser Automation (Playwright)

**Size:** XL | **Depends on:** PM-8 through PM-17, PM-21 | **Blocks:** nothing

Full browser E2E tests covering all prediction market user journeys.

**Files to create:**
- `packages/commonwealth/test/e2e/e2eRegular/predictionMarkets.spec.ts`
- `packages/commonwealth/test/e2e/e2eStateful/predictionMarketLifecycle.spec.ts`

**Follows pattern:** `packages/commonwealth/test/e2e/e2eRegular/newDiscussion.spec.ts`

**Setup pattern:**
```typescript
import { config } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { test, expect } from '@playwright/test';
import { e2eSeeder, login, type E2E_Seeder } from '../utils/e2eUtils';

let seeder: E2E_Seeder;

test.beforeAll(async () => {
  seeder = await e2eSeeder();
});

test.describe('Prediction Markets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${config.SERVER_URL}/${seeder.testChains[0].id}/discussions`,
    );
    await seeder.addAddressIfNone(seeder.testChains[0].id);
    await login(page);
  });
});
```

**Test scenarios — e2eRegular (parallel, empty DB):**

```text
  Test Scenario                     User Actions                         Assertions
  ═════════════                     ════════════                         ══════════

  1. Thread + PM creation
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  a. Navigate to /discussions                                            │
     │  b. Click "New Thread"                                                  │
     │  c. Fill title + body                                                   │
     │  d. Click "Prediction Market" in sidebar/toolbar                        │
     │  e. Fill prompt: "Will ETH hit $5000?"                                  │
     │  f. Set duration: 7 days                                                │
     │  g. Set threshold: 55%                                                  │
     │  h. Submit thread                                                       │
     │                                                                         │
     │  Assert: Thread created with prediction market card visible             │
     │  Assert: Card shows status "DRAFT"                                      │
     │  Assert: Card shows prompt text                                         │
     │  Assert: Card shows probability bar at 50/50                            │
     └──────────────────────────────────────────────────────────────────────────┘

  2. Feature flag gating
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  a. Disable FLAG_PREDICTION_MARKETS                                     │
     │  b. Navigate to /discussions                                            │
     │  c. Click "New Thread"                                                  │
     │                                                                         │
     │  Assert: "Prediction Market" button NOT visible in thread form          │
     │  Assert: Explore page "Markets" tab NOT visible                         │
     │  Assert: Sidebar "Markets" nav entry NOT visible                        │
     └──────────────────────────────────────────────────────────────────────────┘

  3. Thread view — PM card display
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  a. Navigate to thread with active PM (pre-seeded)                      │
     │  b. Verify card in sidebar                                              │
     │                                                                         │
     │  Assert: PredictionMarketCard visible in sidebar                        │
     │  Assert: Shows prompt, probability bar, status badge                    │
     │  Assert: Action buttons visible (Mint, Swap, Merge)                     │
     │  Assert: Shows total collateral locked                                  │
     │  Assert: Shows time remaining countdown                                 │
     └──────────────────────────────────────────────────────────────────────────┘

  4. Explore page — Markets tab
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  a. Navigate to /explore                                                │
     │  b. Click "Markets" tab (or "Prediction Markets" tab)                   │
     │                                                                         │
     │  Assert: Tab visible when flag enabled                                  │
     │  Assert: Market cards render in grid/list                               │
     │  Assert: Filter controls visible (status, chain)                        │
     │  Assert: Clicking a card navigates to thread                            │
     └──────────────────────────────────────────────────────────────────────────┘

  5. Community homepage — Markets section
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  a. Navigate to /{community}/                                           │
     │  b. Scroll to markets section                                           │
     │                                                                         │
     │  Assert: "Active Markets" section visible if markets exist              │
     │  Assert: Horizontal scroll with compact market cards                    │
     │  Assert: "See all" link navigates to markets app page                   │
     │  Assert: Section hidden if no active markets                            │
     └──────────────────────────────────────────────────────────────────────────┘

  6. Sidebar navigation
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  a. Navigate to any community page                                      │
     │  b. Open sidebar                                                        │
     │                                                                         │
     │  Assert: "Prediction Markets" entry visible in governance section       │
     │  Assert: Clicking entry navigates to markets app page                   │
     │  Assert: Admin section shows PM management link (for admins)            │
     └──────────────────────────────────────────────────────────────────────────┘

  7. Page crash tests (all PM routes)
     ┌──────────────────────────────────────────────────────────────────────────┐
     │  For each route:                                                        │
     │    /{community}/prediction-markets                                      │
     │    /{community}/manage/prediction-markets                               │
     │    Thread with PM card                                                  │
     │                                                                         │
     │  Assert: Page loads without crash (no unhandled exceptions)             │
     │  Assert: No console errors on page load                                 │
     └──────────────────────────────────────────────────────────────────────────┘
```

**Test scenarios — e2eStateful (pre-seeded, sequential):**

```text
  Stateful Lifecycle Test (requires pre-seeded active market)
  ════════════════════════════════════════════════════════════

  1. View active market thread
     Assert: Card shows ACTIVE status
     Assert: Probability bar visible
     Assert: Trade buttons enabled

  2. Open trade modal — Mint tab
     Click "Mint" on PM card
     Assert: Modal opens with Mint tab active
     Assert: Amount input visible
     Assert: Collateral cost shown
     Assert: "Deposit & Mint" button visible

  3. Open trade modal — Swap tab
     Click Swap tab
     Assert: PASS/FAIL toggle visible
     Assert: Amount input + slippage setting
     Assert: Estimated output displayed
     Assert: "Swap" button visible

  4. Open trade modal — tab states by market status
     For resolved market:
       Assert: Mint tab disabled
       Assert: Swap tab disabled
       Assert: Redeem tab enabled
     For active market:
       Assert: All tabs except Redeem enabled

  5. Resolve modal — author only
     As thread author, navigate to thread with ended market
     Assert: "Resolve" button visible
     Click "Resolve"
     Assert: Modal shows current TWAP probability
     Assert: Shows predicted outcome
     Assert: "Resolve Market" button visible

  6. Resolve modal — non-author
     As non-author, navigate to same thread
     Assert: "Resolve" button NOT visible

  7. Thread list badge
     Navigate to /discussions
     Assert: Threads with PM show prediction market badge/tag
     Assert: Badge shows probability or status
```

**Acceptance criteria:**
- [ ] All 7 e2eRegular tests pass in parallel
- [ ] All 7 e2eStateful tests pass sequentially
- [ ] Page crash tests cover all PM routes
- [ ] Feature flag gating verified (UI hidden when off)
- [ ] Tests use `e2eSeeder()` and `login(page)` utilities
- [ ] Test data cleaned up in afterAll (DB queries to delete created threads/markets)
- [ ] Playwright timeout set appropriately (60s default)
- [ ] Screenshots captured on failure (Playwright retain-on-failure config)
- [ ] `pnpm -F commonwealth test-e2e` includes these tests

---

### Test Coverage Matrix

| Surface / Feature | Unit | Integration | Devnet | E2E |
|-------------------|------|-------------|--------|-----|
| Zod schemas | PM-19 | — | — | — |
| Sequelize models | PM-19 | — | — | — |
| CreatePredictionMarket | PM-20 | PM-21 | — | PM-25 |
| DeployPredictionMarket | PM-20 | PM-21 | PM-23 | PM-25 |
| ResolvePredictionMarket | PM-20 | PM-21 | PM-23 | PM-25 |
| CancelPredictionMarket | PM-20 | PM-21 | — | — |
| ProjectTrade (mint/swap/merge/redeem) | PM-20 | PM-21 | PM-23 | — |
| ProjectResolution | PM-20 | PM-22 | PM-23 | — |
| Event mappers (8 events) | — | PM-22 | PM-23 | — |
| Policy handlers | — | PM-22 | PM-23 | — |
| Outbox -> RabbitMQ pipeline | — | PM-22 | PM-23 | — |
| Contract interactions (Anvil) | — | — | PM-23 | — |
| Frontend utils (format/calc) | PM-24 | — | — | — |
| Thread + PM creation UI | — | — | — | PM-25 |
| PM card display (all states) | — | — | — | PM-25 |
| Trade modal (all tabs) | — | — | — | PM-25 |
| Resolve modal | — | — | — | PM-25 |
| Explore page markets tab | — | — | — | PM-25 |
| Community homepage section | — | — | — | PM-25 |
| Sidebar navigation | — | — | — | PM-25 |
| Feature flag gating | — | — | — | PM-25 |
| Page crash (all routes) | — | — | — | PM-25 |

### Estimated Test Counts

| Ticket | Test file count | Test case count |
|--------|----------------|-----------------|
| PM-19 | 2 | ~22 |
| PM-20 | 7 | ~35 |
| PM-21 | 1 | ~13 |
| PM-22 | 3 | ~24 |
| PM-23 | 1 | ~15 |
| PM-24 | 2 | ~23 |
| PM-25 | 2 | ~14 scenarios |
| **Total** | **18** | **~146** |

