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
| `libs/model/src/aggregates/quest/CreateQuest.command.ts` | `libs/model/src/aggregates/prediction-market/CreatePredictionMarket.command.ts` |
| `libs/model/src/aggregates/quest/index.ts` (barrel) | `libs/model/src/aggregates/prediction-market/index.ts` (barrel) |

### Status

- [x] Schema consolidation applied (PM-1)
- [x] Model consolidation applied (PM-1)
- [x] Event storming model generated (see below)
- [x] Tickets derived from model slices (PM-1 through PM-9)

---

## Event Storming Model

Event storming maps the full domain flow: **Commands** (user/system intent), **Domain Events** (facts that happened), **Policies** (reactive automation), **Read Models** (query projections), and **External Systems** (on-chain contracts, EVM worker). Tickets are derived from vertical slices through this model.

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
| **System (Policy)** | Automated: reacts to domain events with commands |

### Aggregate: PredictionMarket

```text
SLICE 1: Market Creation
=========================================================================================
  Actor            Command                    Event                      Read Model
  -----            -------                    -----                      ----------
  Thread Author -> CreatePredictionMarket  -> PredictionMarketCreated -> PredictionMarketView
                   [ThreadContext auth]        {market_id, thread_id,     (status: draft)
                   [sets thread.has_pm=true]    prompt, collateral,
                                                duration, threshold}

SLICE 2: Market Deployment
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
        |   Policy: PredictionMarketPolicy                             |
        |   on(ProposalCreated) -> ProjectMarketCreated command        |
        |   [verify/link on-chain addresses to DB record]              |
        +--------------------------------------------------------------+

SLICE 3: Mint Tokens
=========================================================================================
  Actor            External Event             Policy                     Read Model
  -----            --------------             ------                     ----------
  Trader        -> [wallet: Vault.mint()]

        +-- EVM Worker polls TokensMinted log -------------+
        |                                                  |
        |   Policy: PredictionMarketPolicy                 |
        |   on(PredictionMarketTokensMinted)                |
        |     -> command(ProjectPredictionMarketTrade)      |
        |        {action: mint, collateral_amount,          |
        |         p_token_amount, f_token_amount}           |
        |     -> UPSERT PredictionMarketPosition            |
        |     -> UPDATE PredictionMarket.total_collateral   |
        +--------------------------------------------------+
                                                             -> TradeHistory
                                                             -> PositionView
                                                                (p:100, f:100)

SLICE 4: Swap (Express Prediction)
=========================================================================================
  Actor            External Event             Policy                     Read Model
  -----            --------------             ------                     ----------
  Trader        -> [wallet: Router.swap()]

        +-- EVM Worker polls SwapExecuted log -------------+
        |                                                  |
        |   Policy: PredictionMarketPolicy                 |
        |   on(PredictionMarketSwapExecuted)                |
        |     -> command(ProjectPredictionMarketTrade)      |
        |        {action: swap_buy_pass | swap_buy_fail,    |
        |         amount_in, amount_out}                    |
        |     -> UPSERT PredictionMarketPosition            |
        |     -> UPDATE PredictionMarket.current_probability|
        +--------------------------------------------------+
                                                             -> TradeHistory
                                                             -> PositionView
                                                             -> ProbabilityView

SLICE 5: Merge Tokens
=========================================================================================
  Actor            External Event             Policy                     Read Model
  -----            --------------             ------                     ----------
  Trader        -> [wallet: Vault.merge()]

        +-- EVM Worker polls TokensMerged log -------------+
        |                                                  |
        |   Policy: PredictionMarketPolicy                 |
        |   on(PredictionMarketTokensMerged)                |
        |     -> command(ProjectPredictionMarketTrade)      |
        |        {action: merge, p_amount, f_amount,        |
        |         collateral_returned}                      |
        |     -> UPSERT PredictionMarketPosition            |
        |     -> UPDATE PredictionMarket.total_collateral   |
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
        |   Policy: PredictionMarketPolicy                 |
        |   on(PredictionMarketProposalResolved)            |
        |     -> command(ProjectPredictionMarketResolution) |
        |        {winner, resolved_at}                      |
        |     -> UPDATE PredictionMarket status/winner      |
        +--------------------------------------------------+

        +-- EVM Worker polls MarketResolved log -----------+
        |   (redundant confirmation from BinaryVault)      |
        |   Policy: same handler, idempotent               |
        +--------------------------------------------------+

SLICE 7: Token Redemption
=========================================================================================
  Actor            External Event             Policy                     Read Model
  -----            --------------             ------                     ----------
  Trader        -> [wallet: Vault.redeem()]

        +-- EVM Worker polls TokensRedeemed log -----------+
        |                                                  |
        |   Policy: PredictionMarketPolicy                 |
        |   on(PredictionMarketTokensRedeemed)              |
        |     -> command(ProjectPredictionMarketTrade)      |
        |        {action: redeem, winning_token_amount,     |
        |         collateral_returned}                      |
        |     -> UPSERT PredictionMarketPosition            |
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

| Domain Event | Source | Payload | Triggers |
|-------------|--------|---------|----------|
| PredictionMarketCreated | CreatePredictionMarket cmd | market_id, thread_id, prompt, config | -- |
| PredictionMarketDeployed | DeployPredictionMarket cmd | all contract addresses, times | -- |
| PredictionMarketProposalCreated | EVM: FutarchyGovernor | proposal_id, market_id, addresses | ProjectMarketCreated |
| PredictionMarketMarketCreated | EVM: BinaryVault | market_id, p_token, f_token, collateral | ProjectMarketCreated |
| PredictionMarketTokensMinted | EVM: BinaryVault | market_id, user, collateral_amount, token_amounts | ProjectTrade(mint) |
| PredictionMarketTokensMerged | EVM: BinaryVault | market_id, user, p_amount, f_amount, collateral_out | ProjectTrade(merge) |
| PredictionMarketSwapExecuted | EVM: FutarchyRouter | market_id, user, buy_pass, amount_in, amount_out | ProjectTrade(swap) |
| PredictionMarketTokensRedeemed | EVM: BinaryVault | market_id, user, winning_amount, collateral_out | ProjectTrade(redeem) |
| PredictionMarketProposalResolved | EVM: FutarchyGovernor | proposal_id, winner | ProjectResolution |
| PredictionMarketMarketResolved | EVM: BinaryVault | market_id, winner | ProjectResolution |
| PredictionMarketCancelled | CancelPredictionMarket cmd | market_id | -- |

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
                                      +--------------------------------+-------+
                                      |        PredictionMarketPolicy          |
                                      |                                        |
                                      |  on(TokensMinted)    -> ProjectTrade   |
                                      |  on(SwapExecuted)    -> ProjectTrade   |
                                      |  on(TokensMerged)    -> ProjectTrade   |
                                      |  on(TokensRedeemed)  -> ProjectTrade   |
                                      |  on(ProposalCreated) -> ProjectCreated |
                                      |  on(MarketCreated)   -> ProjectCreated |
                                      |  on(ProposalResolved)-> ProjectResolve |
                                      |  on(MarketResolved)  -> ProjectResolve |
                                      +---+------------------------------------+
                                          |
                                          v
                                      +---+----+     +----------+
                                      | System |---->|  Read    |
                                      | Command|     |  Models  |
                                      | (write)|     | (query)  |
                                      +--------+     +----------+
```

---

## Engineering Tickets (Derived from Model Slices)

Tickets are cut as vertical slices through the event storming model. Each slice delivers end-to-end value from schema through to read model.

### TICKET PM-1: Schemas + Models + Migration (Slices 1-8 foundation)

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
- `libs/model/src/models/thread.ts` (add `has_prediction_market` column)

**Follows quests pattern:**

- Single entity schema file covers all entities (like `quest.schemas.ts` covers Quest, QuestActionMeta, QuestTweet, QuestScore)
- Single model file defines all related Sequelize models (like `quest.ts` defines Quest + QuestActionMeta)

**Acceptance criteria:**

- [ ] Single `prediction-market.schemas.ts` exports: PredictionMarket, PredictionMarketTrade, PredictionMarketPosition, PredictionMarketStatus enum, PredictionMarketTradeAction enum
- [ ] Single `prediction_market.ts` model file defines all 3 Sequelize models
- [ ] `PredictionMarkets` table with DECIMAL(78,0) for amounts
- [ ] `PredictionMarketTrades` table with composite PK (eth_chain_id, transaction_hash)
- [ ] `PredictionMarketPositions` table with UNIQUE (prediction_market_id, user_address)
- [ ] `Threads` table has new `has_prediction_market` BOOLEAN column
- [ ] Associations: Community->PM (1:N), Thread->PM (1:N), PM->Trade (1:N), PM->Position (1:N)
- [ ] Indexes on: thread_id, community_id, market_id, status, vault_address, trader_address
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

### TICKET PM-2: Slice 1+2 -- Create + Deploy Market (Commands + Queries)

**Size:** L | **Depends on:** PM-1 | **Blocks:** PM-3, PM-4

Market lifecycle commands following existing aggregate patterns (like `aggregates/quest/`).

**Files to create (in `libs/model/src/aggregates/prediction-market/`):**

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

- [ ] `CreatePredictionMarket`: ThreadContext auth (thread author), creates PM + sets thread.has_prediction_market=true in transaction
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

### TICKET PM-3: Slice 3-5,7 -- Trade Projection (System Commands + Policy)

**Size:** L | **Depends on:** PM-1, PM-4 | **Blocks:** PM-5

System commands for projecting on-chain events into read models. This is the core event storming slice: EVM event -> mapper -> outbox -> policy -> command -> read model.

**Files to create:**

- `libs/model/src/aggregates/prediction-market/ProjectPredictionMarketTrade.command.ts`
- `libs/model/src/aggregates/prediction-market/ProjectPredictionMarketResolution.command.ts`
- `libs/model/src/policies/PredictionMarket.policy.ts`

**Files to modify:**

- `libs/model/src/aggregates/prediction-market/index.ts` (export new commands)
- `libs/model/src/services/evmChainEvents/chain-event-utils.ts` (8 mappers)
- `packages/commonwealth/server/bindings/rascalConsumerMap.ts` (register policy)
- `libs/model/src/index.ts` (export policy)

**Acceptance criteria:**

- [ ] `ProjectPredictionMarketTrade`: system command, creates Trade record, upserts Position (updates balances by action type), updates total_collateral
- [ ] `ProjectPredictionMarketResolution`: system command, updates status=resolved, sets winner + resolved_at
- [ ] 8 mapper functions decode raw EVM logs using ABIs -> typed event payloads
- [ ] `PredictionMarketPolicy` handles all 8 domain events (see Event Storming Model above)
- [ ] Policy registered in rascalConsumerMap
- [ ] Idempotent: composite PK prevents duplicate trades
- [ ] `pnpm -r check-types` passes

**Tests:**

- ProjectTrade: mint creates position, swap updates balances, merge reduces both, redeem reduces winning tokens
- Position aggregation: mint 100 + swap 50 fToken = position(p:152, f:50)
- Mapper tests: raw log hex -> decoded event payload (each of 8 events)
- Policy integration: mock event -> verify DB state
- Idempotency: same event twice, no duplicate trades

---

### TICKET PM-4: Contract ABIs + Event Signatures + Registry

**Size:** M | **Depends on:** nothing | **Blocks:** PM-3

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

- [ ] ABIs extracted from common-protocol helpers, formatted for Viem
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
- [ ] ViewThreadPage: card rendered when thread.has_prediction_market=true

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
  PM-1 (Schemas + Models + Migration)
    |
    +-------> PM-2 (Create/Deploy/Resolve/Cancel commands + Queries)
    |            |
    |            +-------> PM-3 (Trade Projection + Policy)
    |            |              ^
    |            |              |
    |            +-------> PM-5 (tRPC Routes)
    |                        |
    |                        +-------> PM-6 (React Query Hooks)
    |                                    |
    |                                    +-------> PM-7 (Frontend Components)
    |                                                 |
    +-------> PM-4 (ABIs + Sigs)---+                  +-------> PM-8 (Feature Flag)
                                   |                  |
                                   +-> PM-3           +-------> PM-9 (Testing)
```

**Parallelizable work:**

- PM-1 + PM-4 can start simultaneously (no dependencies)
- PM-2 and PM-4 can run in parallel after PM-1
- PM-6 and PM-3 can run in parallel after PM-2/PM-5

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

### Phase 1: Schemas + Models + Migration (PM-1)

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

### Phase 2: Backend Aggregates + API (PM-2 + PM-4 + PM-5)

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

### Phase 3: Chain Events Integration (PM-3 + PM-4)

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
