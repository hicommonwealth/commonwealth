# Commonwealth Frontend Refactor -- Full Plan

## Overview

This plan covers four deliverables:
1. **Hooks/utils extraction spec** -- what goes where
2. **Test strategy** -- what test suites to add during the refactor
3. **Full ASCII DAG** -- epic-to-ticket dependency graph
4. **Deeper architectural refactors** -- structural problems beyond file moves (global `app` singleton, code splitting, controllers/, legacy stores/models, CSS scoping, tRPC completion)

## Status
Legend: [ ] Not started, [~] In progress, [x] Done. Add a completion date in parentheses and PR URL: `(YYMMDD) PR https://github.com/org/repo/pull/NNNNN — summary`.

### EPIC-1: Dead Code Deletion
- [x] 1.1 Delete dead internal dev-tool pages (260202) PR https://github.com/hicommonwealth/commonwealth/pull/13323 — remove internal markdown demo routes/pages + samples
- [x] 1.2 Delete dead helper: momentUpdateLocale.ts (260203) PR https://github.com/hicommonwealth/commonwealth/pull/13324 — remove unused momentUpdateLocale helper
- [x] 1.3 Delete confirmed zero-import components (batch 1) (260203) PR https://github.com/hicommonwealth/commonwealth/pull/13332 — remove dead client files
- [x] 1.4 Delete permanently-flagged legacy code (batch 2) (260203) PR https://github.com/hicommonwealth/commonwealth/pull/13327 — remove newEditor flag + drop NewThreadFormModern path
- [x] 1.5 Consolidate useForceRerender + useRerender (260203) PR https://github.com/hicommonwealth/commonwealth/pull/13325 — keep hooks separate; move useRerender to ContestCard + rename to useContestCardRerender
- [x] 1.6 Audit and clean dead model/store files (260203) PR https://github.com/hicommonwealth/commonwealth/pull/13326 — remove unused SearchResult/PersistentStore/IdStore + move clearLocalStorage
- [x] 1.7 Remove Privy auth layer (revert to Magic-only flow) (260205) PR https://github.com/hicommonwealth/commonwealth/pull/13348 — remove privy auth layer
- [x] 1.8 Remove React Native layer (mobile bridge + MobileAppRedirect) (260205) PR https://github.com/hicommonwealth/commonwealth/pull/13347 — remove RN bridge + mobile app routes/CTA + mobile-only helpers
- [x] 1.9 Remove always-on feature flags and dead code (260204) PR https://github.com/hicommonwealth/commonwealth/pull/13340 — remove always-on flags + dead code; preserve markets gating; drop knockPushNotifications doc example
- [x] 1.10 Remove MDX editor (commonwealth-mdxeditor) (260205) PR https://github.com/hicommonwealth/commonwealth/pull/13338 — remove mdx editor

### EPIC-2: Shared Infrastructure
- [x] 2.1 Set up component test infrastructure (260219) PR TBD — added `renderWithProviders` contract coverage for route overrides, provider overrides, and query client isolation
- [x] 2.2 Create shared/ directory scaffolding + tsconfig/vite aliases (260219) PR TBD — added scoped TS/Vite aliases for `shared/hooks/*`, `shared/utils/*`, `shared/api/*`, `features/*` and scaffolded `client/scripts/shared/*` + `client/scripts/features/`
- [ ] 2.3 Migrate shared reusable hooks to shared/hooks/
- [ ] 2.4 Migrate shared utility helpers to shared/utils/
- [ ] 2.5 Migrate trpcClient to shared/api/
- [ ] 2.6 Update consumer imports for shared hooks
- [ ] 2.7 Update consumer imports for shared utils (batch 1)
- [ ] 2.8 Update consumer imports for shared utils (batch 2)
- [~] 2.9 Write unit tests for extracted shared utils (260218) PR https://github.com/hicommonwealth/commonwealth/pull/13406 — baseline contract suite added under `test/unit/epic2`; extend post-move assertions as modules relocate
- [~] 2.10 Write component tests for extracted shared hooks (260218) PR https://github.com/hicommonwealth/commonwealth/pull/13406 — baseline hook tests added for 6 high-signal hooks; extend as additional hooks move
- [ ] 2.11 Create feature directory stubs + migrate feature-specific helpers
- [ ] 2.12 Migrate feature-specific hooks to feature dirs

EPIC-2 audit note (2026-02-19): milestone `#136` has Epic-1 and test-hardening merged (`#13405` via PR `#13406`), while Epic-2 structural moves/import rewires remain open.

### EPIC-3: Normalize Components
- [ ] 3.1 Decouple useCommunityContests
- [ ] 3.2 Decouple notification subscription hooks
- [ ] 3.3 Split ViewThreadPage container/presentational
- [ ] 3.4 Split DiscussionsPage container/presentational
- [ ] 3.5 Split ExplorePage container/presentational
- [ ] 3.6 Split GovernancePage
- [ ] 3.7 Split CommunityManagement sub-pages
- [ ] 3.8 Split CommunityHomePage + HomePage

### EPIC-4: Feature Migration
- [ ] 4.1 Migrate Leaderboard
- [ ] 4.2 Migrate WalletPage + MyTransactions
- [ ] 4.3 Migrate AdminPanel
- [ ] 4.4 Migrate Auth/Profile/OnBoarding
- [ ] 4.5 Migrate CreateCommunity
- [ ] 4.6 Migrate Search
- [ ] 4.7 Migrate Quests
- [ ] 4.8 Migrate LaunchToken
- [ ] 4.9 Migrate Snapshots
- [ ] 4.10 Migrate Contests
- [ ] 4.11 Migrate Discussions (split 4.11a pages, 4.11b components)
- [ ] 4.12 Migrate Governance
- [ ] 4.13 Migrate Notifications
- [ ] 4.14 Migrate CommunityManagement (split 4.14a admin pages, 4.14b community pages)
- [ ] 4.15 Migrate Explore + Dashboard + HomePage + remaining
- [ ] 4.16 Update ALL route definitions + verify
- [ ] 4.17 Write smoke component tests for each migrated feature
Timing annotation (EPIC-4): complete remaining behavior-depth E2E assertions inside the corresponding migration tickets (especially 4.7 Quests, 4.8 LaunchToken, 4.12 Governance, 4.2/4.10 Wallet+Contest, 4.15 Leaderboard/Explore). Use 4.16 as the consolidation gate for route+behavior readiness.

### EPIC-5: Enforce Boundaries
- [ ] 5.1 Install eslint-plugin-boundaries + configure zones
- [ ] 5.2 Add no-restricted-imports for views/ in feature code
- [ ] 5.3 Add CI check for boundary violations
- [ ] 5.4 Fix all boundary violations

### EPIC-6: Kill views/ + Final Cleanup
- [ ] 6.1 Move component_kit to shared/components/component_kit/
- [ ] 6.2 Move remaining shared components to shared/components/
- [ ] 6.3 Move Layout/Sublayout to shared/layout/
- [ ] 6.4 Move modals to shared/modals/ or features/*/modals/
- [ ] 6.5 Move views/menus/ to shared/components/menus/
- [ ] 6.6 Move remaining static/legal pages to shared/pages/
- [ ] 6.7 Delete the views/ directory
- [ ] 6.8 Delete all deprecated re-export stubs
- [ ] 6.9 Delete old helpers/, hooks/, utils/, controllers/, stores/ dirs
- [ ] 6.10 Update vite.config.ts to remove legacy aliases
- [ ] 6.11 Final circular dependency audit + cleanup
Timing annotation (EPIC-6.11): keep `pnpm depcruise:circular:diff` as the blocking CI guard during 6.1-6.10. Promote to full `pnpm depcruise:circular` blocking only at 6.11 once pre-existing legacy cycles are burned down.

## 1. Hooks/Utils Extraction Spec

### Shared Hooks --> `client/scripts/shared/hooks/` (physical destination; import namespaces defined in Import Update Strategy)

| Hook | Source | Consumers | Move-Together |
|------|--------|-----------|---------------|
| `useNecessaryEffect` | `hooks/useNecessaryEffect.ts` | 14+ files | Base dep for #2, #3 |
| `useRunOnceOnCondition` | `hooks/useRunOnceOnCondition.ts` | imports useNecessaryEffect | Must move with #1 |
| `useAnimation` | `hooks/useAnimation.ts` | imports useNecessaryEffect | Must move with #1 |
| `useBrowserAnalyticsTrack` | `hooks/useBrowserAnalyticsTrack.ts` | analytics consumers | -- |
| `useFlag` | `hooks/useFlag.ts` | many | Move with feature-flags.ts |
| `useAppStatus` | `hooks/useAppStatus.ts` | platform detection | -- |
| `useWindowResize` | `hooks/useWindowResize.ts` | 2 files | -- |
| `useBrowserWindow` | `hooks/useBrowserWindow.ts` | responsive components | -- |
| `useColorScheme` | `hooks/useColorScheme.ts` | theme components | -- |
| `useBeforeUnload` | `hooks/useBeforeUnload.ts` | form components | -- |
| `useForceRerender` | `hooks/useForceRerender.ts` | 6 files (post-consolidation) | -- |
| `useDraft` | `hooks/useDraft.tsx` | thread forms, comments | -- |
| `useDeviceProfile` | `hooks/useDeviceProfile.ts` | device-specific UX conditions | -- |
| `useInitApp` | `hooks/useInitApp.ts` | App.tsx | -- |
| `useManageDocumentTitle` | `hooks/useManageDocumentTitle.ts` | Layout | -- |
| `useDeferredConditionTriggerCallback` | `hooks/useDeferredConditionTriggerCallback.ts` | various | -- |
| `useStickyHeader` | `hooks/useStickyHeader.ts` | Sublayout.tsx | -- |

### Feature-Specific Hooks --> `client/scripts/features/*/hooks/`

| Hook | Destination Feature |
|------|-------------------|
| `useTokenPricing` | `features/tokens/hooks/` |
| `useCommunityCardPrice` | `features/communities/hooks/` |
| `useSearchResults` | `features/search/hooks/` |
| `useMentionExtractor` | `features/discussions/hooks/` |
| `useTopicGating` | `features/communities/hooks/` |
| `useHandleInviteLink` | `features/auth/hooks/` |
| `useNetworkSwitching` | `features/wallet/hooks/` |
| `useInitChainIfNeeded` | `features/governance/hooks/` |
| `useJoinCommunityBanner` | `features/communities/hooks/` |
| `useGetAllCosmosProposals` | `features/governance/hooks/cosmos/` |
| `useShowImage` | `features/discussions/hooks/` |

### Cross-Feature Hooks (must decouple first)

| Hook | Source | Dest | Why It's Critical |
|------|--------|------|-------------------|
| `useCommunityContests` | `CommunityManagement/Contests/` | `features/contests/hooks/` | 17 consumers across 7+ features -- tightest coupling |
| `useThreadSubscriptions` | `NotificationSettings/` | `features/notifications/hooks/` | Used by Discussions |
| `useCommentSubscriptions` | `NotificationSettings/` | `features/notifications/hooks/` | Used by Discussions |
| `useTopicSubscriptions` | `NotificationSettings/` | `features/notifications/hooks/` | Used by NotificationSettings |
| `useSubscriptionPreference*` (3 hooks) | `NotificationSettings/` | `features/notifications/hooks/` | Internal notification plumbing |

### Shared Utils --> `client/scripts/shared/utils/`

Note: `packages/commonwealth/shared/*` already exists and is used today (`shared/utils`, `shared/analytics`, `shared/adapters`, etc.). Epic-2 extracted helper modules should use scoped imports (`shared/utils/<module>`, `shared/hooks/<module>`, `shared/api/<module>`) backed by explicit alias mapping, not a blanket `shared/* -> client/scripts/shared/*` remap.

| File | Source | Consumers | Notes |
|------|--------|-----------|-------|
| `general.ts` (split from `helpers/index.tsx`) | `helpers/index.tsx` | **56 files** | Re-export stub mandatory |
| `constants.ts` | `helpers/constants.ts` | **32 files** | Re-export stub mandatory |
| `formatting.ts` | `helpers/formatting.ts` | 2 files | Move with dates.ts |
| `dates.ts` | `helpers/dates.ts` | -- | Dep of formatting.ts |
| `string.ts`, `number.ts`, `currency.ts` | `helpers/` | ~5-8 each | Straightforward |
| `truncate.ts`, `typeGuards.ts`, `html.ts`, `dom.ts` | `helpers/` | 1-5 each | Straightforward |
| `image.ts`, `browser.ts`, `localStorage.ts`, `rateLimit.ts` | `helpers/` | 3-5 each | Straightforward |
| `link.ts` | `helpers/link.ts` | 4 files | URL validation + social links |
| `formValidations/` | `helpers/formValidations/` | ~10 files | Move as directory |
| `feature-flags.ts` | `helpers/feature-flags.ts` | 2 files | Move with useFlag |
| `clipboard.ts` | `utils/clipboard.ts` | 12 files | Straightforward |
| `downloadDataAsFile.ts`, `ImageCompression.ts` | `utils/` | ~3 each | Straightforward |
| `Permissions.ts` | `utils/Permissions.ts` | ~5 files | Straightforward |
| `tooltipTexts.ts` | `helpers/tooltipTexts.ts` | ~8 files | Pure strings |
| `awsHelpers.ts` | `helpers/awsHelpers.ts` | ~3 files | External services |

### Feature-Specific Utils --> `features/*/utils/`

| File | Destination | Consumers | Re-export Stub? |
|------|-------------|-----------|-----------------|
| `quest.ts` (20+ functions) | `features/quests/utils/` | **23 files** | YES |
| `snapshot_utils.ts` | `features/governance/utils/` | **23 files** | YES |
| `ContractHelpers/` (12 files) | `features/blockchain/contractHelpers/` | **30 files** | YES (all in state/api/) |
| `launchpad.ts` | `features/tokens/utils/` | 1 file | No |
| `feed.ts` | `features/explore/utils/` | 3 files | No |
| `findDenomination.tsx` | `features/tokens/utils/` | ~3 files | No |
| `wallet.ts` | `features/wallet/utils/` | 1 file | No |
| `threads.ts` | `features/discussions/utils/` | ~5 files | No |
| `user.ts` | `features/auth/utils/` | ~3 files | No |

### Core Infrastructure (special handling)

| File | Source | Dest | Consumers | Strategy |
|------|--------|------|-----------|---------|
| `trpcClient.ts` | `utils/trpcClient.ts` | `shared/api/trpcClient.ts` | **199 files** | Re-export stub; update consumers opportunistically during EPIC-4 |

### What NOT to move

- **`state/api/` (150+ React Query hooks)** -- Already well-organized by domain. Multiple features share these. Leave in place.
- **`state/ui/` (15+ Zustand stores)** -- Cross-cutting UI state. Moving into features would create more coupling.

### Import Update Strategy

1. Add scoped tsconfig paths BEFORE any moves:
   - `shared/hooks/*` -> `client/scripts/shared/hooks/*`
   - `shared/utils/*` -> `client/scripts/shared/utils/*`
   - `shared/api/*` -> `client/scripts/shared/api/*`
   - `features/*` -> `client/scripts/features/*`
2. Add matching Vite aliases for scoped namespaces above; do **not** blanket-remap `shared/*` because `packages/commonwealth/shared/*` is already live
3. Use `git mv` for all moves (preserves blame)
4. Create deprecated re-export stubs for files with 10+ consumers
5. Update consumers in batches; delete stubs when grep confirms zero direct imports

---

## 2. Test Strategy

### Current State (Repo Audit: 2026-02-19, post-merge of PR #13406)
- **115 total spec test files**: 19 unit, 20 integration, 54 E2E, 9 devnet, 2 visual, 11 component
- **Smoke coverage**: 3 files / 5 tagged `@smoke` tests
- **E2E quality caveat**: 12 of 49 `e2eRegular` files are still crash-only, but refactor-critical routes now have behavior/security assertions under `@refactor`
- **Component test layer exists**: Vitest+jsdom harness with shared provider render utility and hook/page coverage
- **Stack (lockfile-resolved)**: Vitest 1.6.1 + Playwright 1.44.0
- **Testing-library infra is present**: `@testing-library/react` `^16.3.2`, `@testing-library/jest-dom` `^6.9.1`, `@testing-library/user-event` `^14.6.1`

### Infrastructure Already Merged (PR #13406, merged 2026-02-18)

**Dependencies** (devDependencies in `packages/commonwealth/package.json`):
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

**Component Test Config** (`packages/commonwealth/vitest.component.config.ts`):
- Environment: `jsdom`
- Setup: `packages/commonwealth/test/component/setup.ts`
- Include: `test/component/**/*.{spec,test}.{ts,tsx}`

**Component Render Helper** (`packages/commonwealth/test/component/renderWithProviders.tsx`):
- Wraps providers and router context for stable component-level integration tests
- Supports route and provider overrides used by page contract suites

**Implemented Scripts**:
```
"test-component": "NODE_ENV=test FEATURE_FLAG_GROUP_CHECK_ENABLED=true vitest --config ./vitest.component.config.ts run test/component"
"test-component:watch": "NODE_ENV=test FEATURE_FLAG_GROUP_CHECK_ENABLED=true vitest --config ./vitest.component.config.ts test/component"
```

### Coverage Added (merged in PR #13406)

**EPIC-2 safety-net tests:**
- Shared infrastructure unit contracts: `packages/commonwealth/test/unit/epic2/sharedInfrastructure.utils.contract.spec.ts`
- `trpcClient` contract coverage: `packages/commonwealth/test/unit/epic2/trpcClient.contract.spec.ts`
- Old/new import compatibility checks: `packages/commonwealth/test/unit/epic2/reexportCompatibility.contract.spec.ts`
- Shared hook component tests:
  - `packages/commonwealth/test/component/hooks/useFlag.spec.tsx`
  - `packages/commonwealth/test/component/hooks/useDraft.spec.tsx`
  - `packages/commonwealth/test/component/hooks/useBeforeUnload.spec.tsx`
  - `packages/commonwealth/test/component/hooks/useWindowResize.spec.tsx`
  - `packages/commonwealth/test/component/hooks/useNecessaryEffect.spec.tsx`
  - `packages/commonwealth/test/component/hooks/useForceRerender.spec.tsx`

**EPIC-3 contract coverage:**
- View-thread and discussions extraction contracts:
  - `packages/commonwealth/test/unit/epic3/viewThreadPage.contracts.spec.ts`
  - `packages/commonwealth/test/unit/epic3/discussionsPage.contracts.spec.ts`
- Page-level component integration contracts:
  - `packages/commonwealth/test/component/pages/explorePage.integration.spec.tsx`
  - `packages/commonwealth/test/component/pages/homePage.integration.spec.tsx`
  - `packages/commonwealth/test/component/pages/governancePage.integration.spec.tsx`
  - `packages/commonwealth/test/component/pages/communityHomePage.integration.spec.tsx`

### E2E Coverage Status (post-PR #13406)

| Feature | Current E2E State | Priority |
|---------|-------------------|----------|
| Quests (create/list/detail) | Covered in `refactor-feature-behavior.spec.ts` | P1 delivered |
| LaunchToken flow | Covered in `refactor-feature-behavior.spec.ts` | P1 delivered |
| GovernancePage (`/governance`) | Covered via route matrix + behavior guards | P1 delivered |
| Leaderboard (`/leaderboard`) | Covered in refactor behavior suite | P1 delivered |
| WalletPage (`/wallet`) | Covered for signed-out and signed-in behavior | P1 delivered |
| ContestPage public (`/contest/:id`) | Covered for list + detail route resolution | P1 delivered |
| ExplorePage tabs/filtering | Covered for quests tab controls (`filters`, `search`) | P2 partially delivered |
| Discussions interactions | Still partial; legacy skipped interaction tests remain | P2 remaining |

### Verification Gates Per PR

**PR-required (fast lane):**
1. `pnpm -r check-types` -- zero type errors
2. `pnpm lint-diff` -- no new lint violations
3. `pnpm -F commonwealth bundle` -- production bundle succeeds
4. `pnpm -F commonwealth test-unit` -- unit suite passes
5. `pnpm -F commonwealth test-e2e-smoke --forbid-only` -- smoke suite passes
6. `pnpm -F commonwealth test-component -- --allowOnly=false` -- component suite passes

**Additional gates by PR type (automation-first, changed-file aware):**

| PR Type | Extra Gate |
|---------|-----------|
| Route migration (`navigation/*Routes*`, `Router.tsx`) | Run route-matrix E2E subset for touched routes |
| Privileged/admin/community-manage changes | Run security route-access E2E subset |
| Boundary config/import-layer changes | `pnpm -F commonwealth lint-boundaries` (new script in EPIC-5) |
| Final cleanup (`views/` deletion, alias removal) | `pnpm -F commonwealth no-legacy-imports` + `pnpm -F commonwealth no-stub-imports` + `pnpm depcruise:circular:diff` |
| Visual baseline update PR | Run `pnpm -F commonwealth test-visual:update` and require human approval |

### Regression Avoidance for File Moves

1. **`git mv` first commit** -- zero content changes, preserves blame
2. **Import path updates second commit** -- same PR
3. **Re-export stubs** for files with 10+ consumers
4. **`pnpm -F commonwealth bundle`** after every file-move PR
5. **One feature per PR** -- never mix features, each PR independently revertable
6. **tsconfig/vite aliases added before any moves** (standalone PR)

### Automation-First Decision Log (locked 2026-02-16)

1. **ComponentsShowcase mismatch (`/components`)**
   Keep `/components` temporarily, mark as deprecated, and remove only after replacement visual targets are in place. This prevents noisy false failures in automated visual flows.

2. **Visual baseline strategy**
   Use **committed canonical baselines** for visual tests that are gating quality. Run compare mode (`test-visual`) in automated quality gates (nightly + release-candidate). Restrict baseline updates to dedicated PRs using `test-visual:update` with explicit human approval.
   - Bootstrap note: if no committed baselines exist yet, CI may run update mode artifact generation once to seed the first baseline PR, then return to compare-mode gating.
   - Timing annotation: remove the bootstrap fallback path in EPIC-6 Wave 6 once baselines are stable and consistently committed in normal PR and nightly runs.

3. **Stateful/mature E2E policy**
   Keep mature/stateful-heavy coverage out of normal PR fast lane. Run full suites nightly and as **release-candidate blocking gates**.

4. **Boundary rollout mode**
   Start with **block-new-violations now** (diff-based) while legacy violations remain warning/allowlist for one sprint. Then switch to full blocking once legacy debt is burned down.

5. **Human-in-the-loop checkpoints (required)**
   - Visual baseline changes: explicit reviewer approval before merge.
   - Release candidate promotion: explicit human release sign-off after full suite passes.
   - Temporary boundary allowlist changes: explicit reviewer approval with expiry date.

### Automation Execution Policy

For this refactor program, automation should create issues, draft PRs, and run preconfigured test suites. Humans approve only high-impact checkpoints (baseline updates, release promotion, and temporary policy exceptions).

### 4. Phase 1 Test Backlog Status (EPIC-2..EPIC-6)

Status update (2026-02-17): this PR delivers the full EPIC-2 infrastructure and most high-signal EPIC-3/4/5/6 items. Remaining EPIC-4 depth is primarily richer behavior coverage (beyond guard/path assertions) for specific flows.

| Priority | Epic | Test Type | Scope | Risk Mitigated | Effort | Status |
|----------|------|-----------|-------|----------------|--------|--------|
| P0 | EPIC-2 | Unit | Shared util contract suite (`helpers/index`, `constants`, `formatting`, `dates`, `link`, `formValidations`) | Logical regressions during extraction/re-export | M | Done |
| P0 | EPIC-2 | Component (Vitest + jsdom) | Shared hooks suite (`useFlag`, `useDraft`, `useBeforeUnload`, `useWindowResize`, `useNecessaryEffect`, `useForceRerender`) | Functional and side-effect regressions in hook migration | M | Done |
| P0 | EPIC-2 | Unit/Integration | `trpcClient` contract tests (exports, header shape, query utils) before/after path move | API call and auth header regressions | S | Done |
| P0 | EPIC-2 | Static/Unit | Re-export compatibility tests for old → new paths (high-consumer modules) | Import path breakages after moves | S | Done |
| P0 | EPIC-3 | Component integration | `ViewThreadPage` split contract: loading, error, content, key CTA visibility | Functional/UI regressions from decomposition | M | Partial (contract unit coverage added) |
| P0 | EPIC-3 | Component integration | `DiscussionsPage` split contract: filters, topic parsing, list rendering modes | Functional regressions in critical page behavior | M | Partial (contract unit coverage added) |
| P1 | EPIC-3 | Component integration | `ExplorePage`, `GovernancePage`, `CommunityHomePage`, `HomePage` split smoke + key-state checks | UI regressions and state propagation issues | M | Done |
| P0 | EPIC-4 | E2E | Route migration matrix for touched feature entry routes in common/custom/general routing modes | Functional regressions from route rewiring | M | Done |
| P0 | EPIC-4 | E2E Security | Unauthorized-access checks for `/admin-panel` and community-manage routes | Security regressions on privileged surfaces | S | Done |
| P1 | EPIC-4 | E2E behavior | Quests create/list/detail | Missing feature coverage | M | Partial (list/detail + create-route guard) |
| P1 | EPIC-4 | E2E behavior | LaunchToken happy-path render + key form interactions | Missing feature coverage | M | Partial (render + metadata inputs) |
| P1 | EPIC-4 | E2E behavior | Governance page flag ON/OFF behavior + proposal navigation | Feature-flag and routing regressions | M | Partial (route behavior guard) |
| P1 | EPIC-4 | E2E behavior | Wallet full-page (`/wallet`) and public contest page (`/contest/:id`) | Missing high-risk route coverage | M | Partial (signed-in/out + route resolution) |
| P1 | EPIC-5 | Static lint | Boundary rules + rule-test fixtures + CI enforcement (`lint-boundaries`) | Cross-feature coupling regressions | M | Done |
| P0 | EPIC-6 | Static lint | No-legacy-import checks (`views`, old aliases) + no-stub-import checks | Cleanup regressions after deletions | S | Done |
| P1 | EPIC-6 | Static analysis | Circular dependency gate via dependency-cruiser (`depcruise:circular`) | Runtime/logical regressions from cycles | S | Partial (`depcruise:circular:diff` blocking in CI) |
| P1 | EPIC-6 | Visual | Deterministic key-page visual checks in compare mode | UI regressions during mass moves | M | Done |

### 5. Implementation Plan (Ordered, Incremental, Refactor-Safe)

1. **Wave 0: Baseline + Tooling Contracts**
   Reconcile plan metrics with current repo state and lock ownership matrix for EPIC-2..EPIC-6 tests. Keep visual policy locked to compare mode for gates and update mode only in baseline-update PRs.
2. **Wave 1: EPIC-2 Safety Net First**
   Add component infra (`vitest.component.config.ts`, `test/component/setup.ts`, `renderWithProviders`) and scripts (`test-component`, `test-component:watch`). Implement shared util/hook tests, plus `trpcClient` contract and re-export compatibility tests.
3. **Wave 2: EPIC-3 Pre-Split Guards**
   Add page contract tests for `ViewThreadPage` and `DiscussionsPage` before decomposition. Add focused component integration tests for `Explore/Governance/Home` containers.
4. **Wave 3: EPIC-4 Migration-by-Wave Policy**
   For each migration PR, require touched-route smoke coverage, one behavior scenario, and one security assertion for privileged pages. Fill missing E2E in priority order: Quests → LaunchToken → Governance → Wallet/Contest public → Leaderboard/Explore filters.
   Timing annotation: behavior-depth scenarios are implemented within each corresponding EPIC-4 migration ticket and validated again at 4.16 (not deferred to a post-EPIC cleanup).
5. **Wave 4: EPIC-5 Boundaries**
   Add `eslint-plugin-boundaries` and `lint-boundaries` script. Roll out as block-new-violations immediately (diff-based), legacy violations warning/allowlist for one sprint, then full blocking.
6. **Wave 5: EPIC-6 Cleanup Guards**
   Add no-legacy-import and no-stub-import checks plus `depcruise:circular`. Remove legacy aliases and `views/` only after route matrix, smoke, and key behavior coverage are green.
7. **Wave 6: Hardening + Automation**
   Keep PR lane fast; run mature/stateful-heavy suites nightly and as release-candidate blocking gates. Keep human-in-the-loop approvals for visual baseline changes, RC promotion, and temporary boundary allowlist exceptions.
   EPIC-6 hardening closeout: remove visual bootstrap fallback after baseline stability is demonstrated, and keep compare mode as the only gating mode.

Execution status in PR #13406:
1. Wave 0 completed (baseline reconciled + ownership/gating policy recorded).
2. Wave 1 completed (component harness, scripts, EPIC-2 contracts).
3. Wave 2 mostly completed (EPIC-3 contract tests and key page integration tests).
4. Wave 3 completed for route/security coverage; behavior depth is partially completed for selected features.
5. Wave 4 completed (boundary fixtures + blocking diff gate in CI).
6. Wave 5 completed with diff-blocking cleanup guards (`no-legacy-imports`, `no-stub-imports`, `depcruise:circular:diff`).
7. Wave 6 completed (visual compare gate + baseline-update workflow + nightly/RC hardening workflow).

---

## 3. Full ASCII DAG (Epic --> Ticket)

### Epic Dependency Chain + Parallelism Summary

```
EPIC-1: Dead Code Deletion ──────────────────── 10 tickets, ALL parallel (10 engineers)
    |
    v
EPIC-2: Shared Infrastructure ───────────────── 12 tickets, max 4 parallel lanes
    |
    v
EPIC-3: Normalize Components ───────────────── 8 tickets, max 6 parallel lanes
    |
    v
EPIC-4: Feature Migration ──────────────────── 17 tickets, max 7 parallel lanes
    |
    v
EPIC-5: Enforce Boundaries ─────────────────── 4 tickets, sequential chain
    |
    v
EPIC-6: Kill views/ + Final Cleanup ────────── 11 tickets, max 4 parallel lanes
```

**Total: 62 tickets. Max theoretical parallelism: 10 engineers.**
**Critical path (longest sequential chain): 1.x → 2.2 → 2.4 → 2.7 → 3.1 → 3.3 → 4.11 → 4.16 → 5.1 → 5.4 → 6.1 → 6.7 → 6.11**

---

### Intra-Epic DAGs (parallelism detail)

#### EPIC-1 DAG: Dead Code Deletion
```
All 10 tickets run in parallel (no dependencies between them):

     ┌── 1.1 (dead dev pages)
     ├── 1.2 (momentUpdateLocale)
     ├── 1.3 (zero-import components batch 1)
START┼── 1.4 (permanently-flagged legacy) ⚠ needs product sign-off
     ├── 1.5 (consolidate useForceRerender)
     ├── 1.6 (dead models/stores)
     ├── 1.7 (remove Privy layer)
     ├── 1.8 (remove React Native layer) [DONE 260205]
     ├── 1.9 (remove always-on feature flags + dead code)
     └── 1.10 (remove MDX editor: commonwealth-mdxeditor)

Parallelism: 10 lanes → 10 engineers can work simultaneously
Sequential depth: 1 (one layer)
```

#### EPIC-2 DAG: Shared Infrastructure
```
                    EPIC-1 done
                        │
              ┌─────────┼─────────┐
              v         v         v
            2.1       2.2       (wait)
          (test     (dirs +       │
          infra)   aliases)       │
              │    ┌──┼──┬──┐     │
              │    v  v  v  v     │
              │  2.3 2.4 2.5 2.11 │  ← 4 parallel lanes
              │   │   │   │   │   │
              │   │  ┌┴┐  │   │   │
              │   v  v v  │   v   │
              │  2.6 2.7 2.8 2.12 │  ← 2.7 and 2.8 parallel
              │       │   │       │
              └───┬───┘   │       │
                  v       │       │
                2.10      │       │
              (hook       │       │
              tests)      v       │
                        2.9       │
                      (util       │
                      tests)      │
                                  │

Parallelism: max 4 lanes (2.3, 2.4, 2.5, 2.11 can run simultaneously)
Sequential depth: 4 layers (2.2 → 2.4 → 2.7 → consumer updates)

Lane assignments:
  Lane A: 2.1 → 2.10 (test infra → hook tests)
  Lane B: 2.2 → 2.3 → 2.6 (dirs → shared hooks → consumer updates)
  Lane C: 2.2 → 2.4 → 2.7/2.8 → 2.9 (dirs → shared utils → consumers → util tests)
  Lane D: 2.2 → 2.5 + 2.11 → 2.12 (dirs → trpc + feature helpers → feature hooks)
```

#### EPIC-3 DAG: Normalize Components
```
                  EPIC-2 done
                      │
              ┌───────┼───────┐
              v       v       v
            3.1     3.2    ┌──┴──┬─────┐
         (decouple (decouple│    │     │
         contests) notif)  3.6  3.7   3.8
              │       │   (gov)(CM) (home)
         ┌────┼───────┘
         v    v    v
        3.3  3.4  3.5        ← 3.3/3.4/3.5 parallel (after 3.1)
      (view (disc (explore)
      thread) page)

Parallelism: max 6 lanes (3.1, 3.2, 3.6, 3.7, 3.8 all start immediately; 3.3-3.5 after 3.1)
Sequential depth: 2 layers (3.1 → 3.3/3.4/3.5)

Lane assignments:
  Lane A: 3.1 → 3.3 (decouple contests → split ViewThreadPage)
  Lane B: 3.1 → 3.4 (decouple contests → split DiscussionsPage)  [shares 3.1 with A]
  Lane C: 3.1 → 3.5 (decouple contests → split ExplorePage)      [shares 3.1 with A]
  Lane D: 3.2 (decouple notification hooks)
  Lane E: 3.6 (split GovernancePage)
  Lane F: 3.7 (split CommunityManagement sub-pages)
  Lane G: 3.8 (split CommunityHomePage + HomePage)

Note: 3.1 is the CRITICAL PATH bottleneck. Assign your strongest eng.
```

#### EPIC-4 DAG: Feature Migration
```
                      EPIC-3 done
                          │
    WAVE 1 ───────────────┼──────────────────────
    (independent)         │
         ┌──┬──┬──┬──┬──┬┴┐
         v  v  v  v  v  v v
        4.1 4.2 4.3 4.4 4.5 4.6 4.7    ← 7 parallel lanes!
        (lb)(wal)(adm)(auth)(cc)(srch)(quest)
                          │
    WAVE 2 ───────────────┼──────────────────────
    (moderate coupling)   │
                     ┌────┘
                     v
                    4.8 (LaunchToken, needs 4.5)
                    4.9 (Snapshots, needs 3.6)
                          │
    WAVE 3 ───────────────┼──────────────────────
    (tight coupling)      │
              ┌───┬───┬───┼───┐
              v   v   v   v   v
            4.10 4.11 4.12 4.13 4.14    ← 5 parallel lanes
           (cont)(disc)(gov)(notif)(CM)
                          │
    WAVE 4 ───────────────┼──────────────────────
                          v
                        4.15 (Explore + Dashboard + remaining)
                          │
                          v
                        4.16 (update ALL routes, verify)
                          │
                          v
                        4.17 (smoke tests for all features)

Parallelism: max 7 lanes (Wave 1)
Sequential depth: 4 waves (Wave 1 → Wave 2 → Wave 3 → Wave 4)

Wave 1 lane assignments (ALL INDEPENDENT -- assign freely):
  Eng A: 4.1 (Leaderboard)
  Eng B: 4.2 (Wallet)
  Eng C: 4.3 (Admin)
  Eng D: 4.4 (Auth/Profile)
  Eng E: 4.5 (CreateCommunity)
  Eng F: 4.6 (Search)
  Eng G: 4.7 (Quests)

Wave 3 lane assignments (check blockers):
  4.10 blocked-by: 3.1
  4.11 blocked-by: 3.1, 3.2, 3.3, 3.4 (LATEST to unblock -- critical path)
  4.12 blocked-by: 3.6, 4.9
  4.13 blocked-by: 3.2
  4.14 blocked-by: 3.7, 4.10
```

#### EPIC-5 DAG: Enforce Boundaries
```
EPIC-4 done → 5.1 → 5.2 → 5.3 → 5.4

Strictly sequential. 1 engineer.
Sequential depth: 4
```

#### EPIC-6 DAG: Kill views/ + Final Cleanup
```
            EPIC-5 done
                │
                v
              6.1 (component_kit → shared/)  ← LARGEST MOVE
                │
                v
              6.2 (remaining shared components)
           ┌──┬┴┬──┐
           v  v v  v
         6.3 6.4 6.5 6.6    ← 4 parallel lanes
        (lay)(mod)(menu)(static)
           └──┬┴┬──┘
              v
            6.7 (delete views/)
              │
              v
            6.8 (delete re-export stubs)
              │
              v
            6.9 (delete old dirs)
              │
              v
           6.10 (remove legacy vite aliases)
              │
              v
           6.11 (circular dep audit + final verification)

Parallelism: max 4 lanes (6.3, 6.4, 6.5, 6.6)
Sequential depth: 7 layers (6.1 → 6.2 → 6.3 → 6.7 → 6.8 → 6.9 → 6.11)
```

---

### Parallelism Summary Table

| Epic | Tickets | Max Parallel Lanes | Sequential Depth | Bottleneck |
|------|---------|-------------------|-----------------|------------|
| 1: Dead Code | 10 | **10** | 1 | Product sign-off on 1.4 |
| 2: Shared Infra | 12 | **4** | 4 | 2.2 (aliases) gates everything |
| 3: Normalize | 8 | **6** | 2 | 3.1 (useCommunityContests) gates 3.3-3.5 |
| 4: Feature Migration | 17 | **7** | 4 waves | 4.11 (Discussions) has most blockers |
| 5: Boundaries | 4 | **1** | 4 | Sequential by nature |
| 6: Kill views/ | 11 | **4** | 7 | 6.1 (component_kit, 8k LOC) |
| **Total** | **62** | **10 peak** | -- | -- |

### EPIC-1: Dead Code Deletion

All tickets are parallelizable.

```
EPIC-1: Dead Code Deletion
├── 1.1: Delete dead internal dev-tool pages [PARALLEL]
│   files: views/pages/QuillPage/, MarkdownEditorPage/, MarkdownViewerPage/,
│          MarkdownHitHighlighterPage/, ComponentsShowcase/
│          + route entries in CommonDomainRoutes.tsx, GeneralRoutes.tsx
│   ~1200 LOC delete, ~20 LOC modify
│   blocked-by: none
│   reviewer: frontend
│
├── 1.2: Delete dead helper: momentUpdateLocale.ts [PARALLEL]
│   ~30 LOC delete
│   blocked-by: none
│   reviewer: frontend
│
├── 1.3: Delete confirmed zero-import components (batch 1) [PARALLEL]
│   files: grep-verified zero-import files from 146-candidate audit
│   ~500-2000 LOC delete
│   blocked-by: none
│   reviewer: frontend
│
├── 1.4: Delete permanently-flagged legacy code (batch 2) [PARALLEL]
│   files: NewThreadFormLegacy/, react_quill_editor/ (if flags permanent)
│   ~3000 LOC delete
│   blocked-by: product sign-off on flag status
│   reviewer: frontend
│
├── 1.5: Consolidate useForceRerender + useRerender [PARALLEL]
│   files: hooks/useForceRerender.ts (keep), hooks/useRerender.ts (delete)
│          + 6 consuming files
│   ~30 LOC delete, ~20 LOC modify
│   blocked-by: none
│   reviewer: frontend
│
├── 1.6: Audit and clean dead model/store files [PARALLEL]
│   files: models/SearchQuery.ts, SearchResult.ts, stores/IdStore.ts,
│          PersistentStore.ts, ProposalStore.ts (grep-verify each)
│   ~200-500 LOC delete
│   blocked-by: none
│   reviewer: frontend
│
├── 1.7: Remove Privy auth layer (revert to Magic-only flow) [PARALLEL]
│   files: shared/components/Privy/, auth provider wiring, env flags, package deps
│   remove: Privy SDK usage + Privy-specific UI flows
│   ~800-1200 LOC delete
│   blocked-by: product sign-off (confirm Magic-only auth)
│   reviewer: frontend
│
├── 1.8: Remove React Native layer (mobile bridge + MobileAppRedirect) [PARALLEL]
│   files: hooks/mobile/useMobileRPCSender.ts, useMobileRPCEventReceiver.ts,
│          hooks/useReactNativeWebView.ts, MobileAppRedirect page + routes
│   remove: RN WebView postMessage bridge + isMobileApp() detection
│   ~500-1200 LOC delete
│   blocked-by: product sign-off (mobile app sunset)
│   reviewer: frontend
│   status: DONE (260205) PR https://github.com/hicommonwealth/commonwealth/pull/13347
│
├── 1.9: Remove always-on feature flags and dead code [PARALLEL]
│   files: grep for always-on flags + guarded branches; delete unused toggles
│   remove: flag definitions + dead branches
│   ~LOC delete: TBD (audit)
│   blocked-by: TBD (confirm always-on flags)
│   reviewer: frontend
│
└── 1.10: Remove MDX editor (commonwealth-mdxeditor) [PARALLEL]
    files: grep for commonwealth-mdxeditor references + editor wiring
    remove: package dependency + integration points
    ~LOC delete: TBD (audit)
    blocked-by: TBD (confirm removal/replacement)
    reviewer: frontend
```

### EPIC-2: Shared Infrastructure

```
EPIC-2: Shared Infrastructure
├── 2.1: Set up component test infrastructure [blocked-by: EPIC-1]
│   new: vitest.component.config.ts, test/component/setup.ts,
│        test/component/renderWithProviders.tsx
│   deps: @testing-library/react, jest-dom, user-event
│   ~250 LOC new
│   reviewer: frontend
│
├── 2.2: Create shared/ directory scaffolding + tsconfig/vite aliases [blocked-by: EPIC-1]
│   new dirs: client/scripts/shared/{hooks,utils,api}, client/scripts/features/
│   modify: packages/commonwealth/tsconfig.json, packages/commonwealth/client/vite.config.ts
│   NOTE: keep existing package-level `shared/*` imports intact; add scoped aliases
│         (`shared/hooks/*`, `shared/utils/*`, `shared/api/*`, `features/*`) only
│   ~40 LOC modify
│   reviewer: full-stack
│
├── 2.3: Migrate shared reusable hooks to shared/hooks/ [blocked-by: 2.2, 1.5]
│   move: 17 hooks via git mv (including `useDeviceProfile`)
│   create: shared/hooks/index.ts barrel, hooks/index.ts re-export stub
│   ~500 LOC move, ~80 LOC new
│   reviewer: frontend
│   MOVE-TOGETHER: useNecessaryEffect + useRunOnceOnCondition + useAnimation
│
├── 2.4: Migrate shared utility helpers to shared/utils/ [blocked-by: 2.2]
│   move: 25 files via git mv
│   create: shared/utils/index.ts barrel
│   HIGH-IMPACT: helpers/index.tsx (56 consumers), constants.ts (32 consumers)
│   ~1500 LOC move, ~60 LOC new
│   reviewer: frontend
│
├── 2.5: Migrate trpcClient to shared/api/ [blocked-by: 2.2]
│   move: utils/trpcClient.ts -> shared/api/trpcClient.ts
│   create: utils/trpcClient.ts re-export stub
│   199 consumers -- stub is mandatory
│   ~50 LOC move
│   reviewer: frontend
│
├── 2.6: Update consumer imports for shared hooks [blocked-by: 2.3]
│   ~40-50 files, ~100 LOC modify
│   reviewer: frontend
│
├── 2.7: Update consumer imports for shared utils (batch 1) [blocked-by: 2.4] [PARALLEL w/ 2.8]
│   ~20 files, ~50 LOC modify
│   reviewer: frontend
│
├── 2.8: Update consumer imports for shared utils (batch 2) [blocked-by: 2.4] [PARALLEL w/ 2.7]
│   ~20 files, ~50 LOC modify
│   reviewer: frontend
│
├── 2.9: Write unit tests for extracted shared utils [blocked-by: 2.4] [PARALLEL w/ 2.6-2.8]
│   baseline merged: `test/unit/epic2/*.spec.ts` in PR #13406
│   new in this wave: post-move assertions + alias-resolution coverage for extracted modules
│   reviewer: frontend
│
├── 2.10: Write component tests for extracted shared hooks [blocked-by: 2.1, 2.3] [PARALLEL]
│   baseline merged: 6 hook specs in `test/component/hooks/*` (PR #13406)
│   new in this wave: extend suite as additional hooks are moved to shared/hooks
│   reviewer: frontend
│
├── 2.11: Create feature directory stubs + migrate feature-specific helpers [blocked-by: 2.2]
│   new dirs: features/{quests,governance,tokens,explore,blockchain,wallet,
│             discussions,auth,contests,notifications,communities,search}/
│   move: 10 helper files/directories
│   HIGH-IMPACT: quest.ts (23 consumers), snapshot_utils.ts (23), ContractHelpers/ (30)
│   ~3000 LOC move
│   reviewer: frontend
│
└── 2.12: Migrate feature-specific hooks to feature dirs [blocked-by: 2.2, 2.3]
    move: 12 hooks to respective feature directories
    NOTE: React Native hooks removed in EPIC-1.8 are intentionally excluded
    ~800 LOC move
    reviewer: frontend
```

### EPIC-3: Normalize Components

```
EPIC-3: Normalize Components
├── 3.1: Decouple useCommunityContests [blocked-by: 2.11] [CRITICAL PATH]
│   move: CommunityManagement/Contests/useCommunityContests.ts
│         -> features/contests/hooks/useCommunityContests.ts
│   create: re-export at old location
│   17 consumers -- must decouple before Discussions/ViewThread/Explore migration
│   ~200 LOC move
│   reviewer: frontend
│
├── 3.2: Decouple notification subscription hooks [blocked-by: 2.12] [PARALLEL w/ 3.1]
│   move: 7 hooks from NotificationSettings/ -> features/notifications/hooks/
│   ~400 LOC move
│   reviewer: frontend
│
├── 3.3: Split ViewThreadPage container/presentational [blocked-by: 3.1]
│   extract: useViewThreadData.ts hook from ViewThreadPage.tsx (1201 lines)
│   ~300 LOC new, ~800 LOC modify
│   reviewer: frontend
│
├── 3.4: Split DiscussionsPage container/presentational [blocked-by: 3.1] [PARALLEL w/ 3.3]
│   extract: useDiscussionsData.ts hook
│   ~200 LOC new, ~600 LOC modify
│   reviewer: frontend
│
├── 3.5: Split ExplorePage container/presentational [blocked-by: 3.1] [PARALLEL w/ 3.3-3.4]
│   extract: useExploreData.ts hook
│   ~200 LOC new, ~500 LOC modify
│   reviewer: frontend
│
├── 3.6: Split GovernancePage [blocked-by: EPIC-2] [PARALLEL w/ 3.3-3.5]
│   ~150 LOC new, ~400 LOC modify
│   reviewer: frontend
│
├── 3.7: Split CommunityManagement sub-pages [blocked-by: EPIC-2] [PARALLEL w/ 3.3-3.6]
│   Topics/, Integrations/, AdminsAndModerators/
│   ~400 LOC new, ~1000 LOC modify
│   reviewer: frontend
│
└── 3.8: Split CommunityHomePage + HomePage [blocked-by: EPIC-2] [PARALLEL w/ 3.3-3.7]
    ~300 LOC new, ~600 LOC modify
    reviewer: frontend
```

### EPIC-4: Feature Migration

```
EPIC-4: Feature Migration
│
│  WAVE 1 -- Independent features (all parallelizable)
├── 4.1: Migrate Leaderboard [blocked-by: EPIC-3] [PARALLEL]
│   views/pages/Leaderboard/ -> features/leaderboard/pages/
│   ~800 LOC move
│
├── 4.2: Migrate WalletPage + MyTransactions [PARALLEL]
│   -> features/wallet/pages/
│   ~1000 LOC move
│
├── 4.3: Migrate AdminPanel [PARALLEL]
│   -> features/admin/pages/
│   ~800 LOC move
│
├── 4.4: Migrate Auth/Profile/OnBoarding [PARALLEL]
│   -> features/auth/pages/ + features/auth/components/
│   ~1500 LOC move
│
├── 4.5: Migrate CreateCommunity [PARALLEL]
│   -> features/communities/pages/CreateCommunity/
│   ~800 LOC move
│
├── 4.6: Migrate Search [PARALLEL]
│   -> features/search/pages/
│   ~400 LOC move
│
├── 4.7: Migrate Quests [PARALLEL]
│   -> features/quests/pages/
│   ~2000 LOC move
│
│  WAVE 2 -- Moderate coupling
├── 4.8: Migrate LaunchToken [blocked-by: 4.5]
│   -> features/tokens/pages/
│   ~500 LOC move
│
├── 4.9: Migrate Snapshots [blocked-by: 3.6]
│   -> features/governance/pages/Snapshots/ + components/
│   ~1800 LOC move
│
│  WAVE 3 -- Tight coupling (requires decoupling from EPIC-3)
├── 4.10: Migrate Contests [blocked-by: 3.1]
│   -> features/contests/ (pages, admin, components)
│   ~3000 LOC move
│
├── 4.11: Migrate Discussions [blocked-by: 3.1, 3.2, 3.3, 3.4]
│   -> features/discussions/ (pages, components)
│   LARGEST PR -- split into 4.11a (pages) + 4.11b (components)
│   ~6000 LOC move
│
├── 4.12: Migrate Governance [blocked-by: 3.6, 4.9]
│   -> features/governance/ (pages, components)
│   ~3500 LOC move
│
├── 4.13: Migrate Notifications [blocked-by: 3.2]
│   -> features/notifications/ (pages, components)
│   ~1500 LOC move
│
├── 4.14: Migrate CommunityManagement (remaining) [blocked-by: 3.7, 4.10]
│   -> features/communities/admin/ + pages/
│   Split into 4.14a (admin pages) + 4.14b (community pages)
│   ~4000 LOC move
│
│  WAVE 4 -- Hub/aggregator features
├── 4.15: Migrate Explore + Dashboard + HomePage + remaining [blocked-by: 3.5, 3.8]
│   -> features/explore/, features/dashboard/, misc
│   ~3000 LOC move
│
├── 4.16: Update ALL route definitions + verify [blocked-by: 4.1-4.15]
│   files: CommonDomainRoutes.tsx, CustomDomainRoutes.tsx, GeneralRoutes.tsx
│   ~150 LOC modify
│   GATE: pnpm -F commonwealth bundle must succeed
│
└── 4.17: Write smoke component tests for each migrated feature [blocked-by: 4.16, 2.1]
    14 smoke tests, ~900 LOC new
```

### EPIC-5: Enforce Boundaries

```
EPIC-5: Enforce Boundaries
├── 5.1: Install eslint-plugin-boundaries + configure zones [blocked-by: EPIC-4]
│   define: shared, feature, stateApi, legacy zones
│   rules: features/* cannot import features/<other>/*; shared cannot import features
│   ~120 LOC new
│   reviewer: full-stack
│
├── 5.2: Add no-restricted-imports for views/ in feature code [blocked-by: 5.1]
│   ~30 LOC modify
│
├── 5.3: Add CI check for boundary violations [blocked-by: 5.2]
│   ~30 LOC modify
│
└── 5.4: Fix all boundary violations [blocked-by: 5.3]
    Move shared components to shared/; create proper shared interfaces
    ~300-500 LOC modify
```

### EPIC-6: Kill views/ + Final Cleanup

```
EPIC-6: Kill views/ + Final Cleanup
├── 6.1: Move component_kit to shared/components/component_kit/ [blocked-by: EPIC-5]
│   ~8000 LOC move (LARGEST SINGLE MOVE)
│
├── 6.2: Move remaining shared components to shared/components/ [blocked-by: 6.1]
│   ~5000 LOC move (split into 2-3 sub-PRs)
│
├── 6.3: Move Layout/Sublayout to shared/layout/ [blocked-by: 6.2] [PARALLEL]
│   ~1200 LOC move
│
├── 6.4: Move modals to shared/modals/ or features/*/modals/ [blocked-by: 6.2] [PARALLEL]
│   ~3500 LOC move (split: shared modals first, then feature modals)
│
├── 6.5: Move views/menus/ to shared/components/menus/ [blocked-by: 6.2] [PARALLEL]
│   ~500 LOC move
│
├── 6.6: Move remaining static/legal pages [blocked-by: 6.2] [PARALLEL]
│   terms, privacy, 404, error -> shared/pages/
│   ~200 LOC move
│
├── 6.7: Delete the views/ directory [blocked-by: 6.1-6.6]
│   Remove views/ alias from vite.config.ts and tsconfig
│   ~10 LOC modify
│
├── 6.8: Delete all deprecated re-export stubs [blocked-by: 6.7]
│   ~200 LOC delete
│
├── 6.9: Delete old helpers/, hooks/, utils/, controllers/, stores/ dirs [blocked-by: 6.8]
│   ~100 LOC modify
│
├── 6.10: Update vite.config.ts to remove legacy aliases [blocked-by: 6.9]
│   Remove: hooks, helpers, controllers, models aliases
│   ~20 LOC modify
│
└── 6.11: Final circular dependency audit + cleanup [blocked-by: 6.10]
    Run: pnpm depcruise:circular, bundle, check-types, test-component, test-unit
    Transition note: switch from `pnpm depcruise:circular:diff` (guarding new cycles) to full `pnpm depcruise:circular` blocking at this step.
    ~200 LOC modify
```

---

## Before/After LOC Analysis & DevX Impact

### Current State: `client/scripts/` (159k LOC, 1,986 files)

```
client/scripts/                    159,062 LOC   1,986 files
├── views/                         125,824  79%  1,496 files  ← EVERYTHING lives here
│   ├── components/
│   │   ├── component_kit/          15,570  10%               ← design system
│   │   ├── react_quill_editor/      3,844   2%               ← legacy editor
│   │   ├── sidebar/                 3,294   2%
│   │   ├── NewThreadFormLegacy/     3,023   2%               ← dead if flag permanent
│   │   ├── Profile/                 2,070   1%
│   │   ├── SublayoutHeader/         1,959   1%
│   │   ├── MarkdownEditor/          1,958   1%
│   │   ├── (38 more dirs >100 LOC) ~15,000
│   │   └── (many small components)
│   ├── pages/
│   │   ├── CommunityManagement/    10,583   7%               ← biggest page
│   │   ├── discussions/             6,041   4%
│   │   ├── CommunityGroupsAndMembers/ 4,748  3%
│   │   ├── WalletPage/              3,986   3%
│   │   ├── CreateQuest/             3,229   2%
│   │   ├── ExplorePage/             2,924   2%
│   │   ├── AdminPanel/              2,640   2%
│   │   ├── ComponentsShowcase/      2,432   2%               ← dead code
│   │   ├── view_thread/             2,257   1%
│   │   ├── CreateCommunity/         2,047   1%
│   │   ├── (19 more dirs >100 LOC) ~14,000
│   │   └── (small pages + redirects)
│   └── modals/
│       ├── TradeTokenModel/         2,427
│       ├── AuthModal/               2,360
│       ├── ManageCommunityStakeModal/ 1,156
│       └── (11 more >50 LOC)       ~3,000
├── controllers/                    10,770   7%     73 files  ← wallet adapters + chain code
├── state/                          10,330   6%    289 files
│   ├── api/                         9,292                    ← React Query hooks (well-organized)
│   └── ui/                            932                    ← Zustand stores
├── helpers/                         5,036   3%     45 files  ← grab bag of utils
├── models/                          2,168   1%     27 files  ← client-side models
├── hooks/                           1,970   1%     32 files  ← custom hooks (scattered)
├── navigation/                      1,851   1%      5 files
├── utils/                             573   0%     10 files  ← overlaps with helpers/
├── stores/                            384   0%      8 files  ← legacy stores
└── lib/                                24   0%      1 file
```

**DevX problems in the pre-hardening baseline:**
- **"Where does this go?"** -- No clear answer. hooks/ vs helpers/ vs utils/ vs state/ vs controllers/ are all grab bags. New code goes wherever the dev guesses.
- **views/ is 79% of the codebase** -- A search for anything returns views/ results. Feature boundaries don't exist.
- **Cross-feature imports everywhere** -- DiscussionsPage imports from CommunityManagement/Contests/. NotificationSettings exports hooks consumed by Discussions. No enforcement.
- **Duplicate patterns** -- helpers/clipboard.ts AND utils/clipboard.ts. useForceRerender AND useRerender. helpers/index.tsx is a 278-line junk drawer.
- **Component tests were absent** -- before this hardening program, only E2E tests caught UI regressions.
- **Finding a feature's code requires searching 4+ directories** -- Page in views/pages/, components in views/components/, hooks in hooks/, state in state/api/, helpers in helpers/.

---

### After State: `client/scripts/` (~152k LOC, ~1,850 files)

**~7k LOC deleted** (dead code + duplicates), rest reorganized:

```
client/scripts/                    ~152,000 LOC   ~1,850 files
│
├── features/                       ~95,000  63%  ~1,100 files  ← FEATURE-ORGANIZED
│   ├── discussions/                ~10,000                     ← pages + components + hooks
│   │   ├── pages/
│   │   │   ├── DiscussionsPage.tsx              (+ useDiscussionsData.ts)
│   │   │   ├── ViewThreadPage.tsx               (+ useViewThreadData.ts)
│   │   │   ├── new_thread.tsx
│   │   │   └── (redirects)
│   │   ├── components/
│   │   │   ├── Comments/
│   │   │   ├── NewThreadFormModern/
│   │   │   ├── Polls/
│   │   │   └── StickEditorContainer/
│   │   ├── hooks/
│   │   │   ├── useMentionExtractor.ts
│   │   │   └── useShowImage.ts
│   │   ├── utils/
│   │   │   └── threads.ts
│   │   └── modals/
│   │       ├── ArchiveThreadModal/
│   │       ├── ThreadPreviewModal/
│   │       └── (5 more discussion modals)
│   │
│   ├── communities/                ~18,000                     ← management + public pages
│   │   ├── admin/
│   │   │   ├── Topics/
│   │   │   ├── Integrations/
│   │   │   ├── AdminsAndModerators/
│   │   │   ├── CommunityProfile/
│   │   │   ├── StakeIntegration/
│   │   │   └── (more admin sub-features)
│   │   ├── pages/
│   │   │   ├── CreateCommunity/
│   │   │   ├── CommunityHome/
│   │   │   ├── GroupsAndMembers/
│   │   │   └── DirectoryPage/
│   │   ├── hooks/
│   │   │   ├── useCommunityCardPrice.ts
│   │   │   ├── useTopicGating.ts
│   │   │   └── useJoinCommunityBanner.tsx
│   │   └── modals/
│   │       ├── ManageCommunityStakeModal/
│   │       └── (3 more)
│   │
│   ├── governance/                  ~8,000
│   │   ├── pages/
│   │   │   ├── GovernancePage/
│   │   │   ├── Snapshots/
│   │   │   ├── NewProposalViewPage/
│   │   │   └── view_proposal/
│   │   ├── hooks/
│   │   │   ├── cosmos/useGetAllCosmosProposals.tsx
│   │   │   └── useInitChainIfNeeded.ts
│   │   ├── utils/
│   │   │   └── snapshot.ts
│   │   └── components/
│   │       └── proposals/
│   │
│   ├── contests/                    ~5,500
│   │   ├── pages/ (ContestPage, Contests)
│   │   ├── admin/ (AdminContestsPage, ManageContest)
│   │   ├── hooks/ (useCommunityContests ← THE critical hook)
│   │   └── components/ (ContestCard, ThreadContestTag)
│   │
│   ├── wallet/                      ~5,000
│   │   ├── pages/ (WalletPage, MyTransactions)
│   │   ├── hooks/ (useNetworkSwitching)
│   │   ├── utils/ (wallet.ts)
│   │   └── modals/ (ManageMagicWalletModal)
│   │
│   ├── explore/                     ~4,000
│   │   ├── pages/ (ExplorePage, HomePage)
│   │   └── utils/ (feed.ts)
│   │
│   ├── quests/                      ~5,000
│   │   ├── pages/ (CreateQuest, QuestDetails, QuestsList, UpdateQuest)
│   │   └── utils/ (quest.ts)
│   │
│   ├── auth/                        ~5,500
│   │   ├── pages/ (OnBoarding, profiles, finish_social_login)
│   │   ├── components/ (SignIn, EditProfile)
│   │   ├── hooks/ (useHandleInviteLink)
│   │   ├── utils/ (user.ts, magicNetworkUtils.ts)
│   │   └── modals/ (AuthModal, WelcomeOnboardModal, InviteLinkModal)
│   │
│   ├── tokens/                      ~6,500
│   │   ├── pages/ (LaunchToken)
│   │   ├── hooks/ (useTokenPricing)
│   │   ├── utils/ (launchpad.ts, findDenomination.tsx)
│   │   └── modals/ (TradeTokenModel, ThreadTokenModal)
│   │
│   ├── notifications/               ~2,000
│   │   ├── pages/ (notifications, NotificationSettings, UnSubscribePage)
│   │   ├── hooks/ (useThreadSubscriptions, useCommentSubscriptions, etc.)
│   │   └── components/ (KnockNotifications)
│   │
│   ├── admin/                       ~2,700
│   │   └── pages/ (AdminPanel)
│   │
│   ├── search/                      ~1,000
│   │   ├── pages/ (search)
│   │   └── hooks/ (useSearchResults)
│   │
│   ├── leaderboard/                   ~600
│   │   └── pages/ (Leaderboard, XPTable)
│   │
│   ├── blockchain/                  ~3,500
│   │   └── contractHelpers/ (12 contract helper files)
│   │
│   ├── dashboard/                     ~600
│   │   └── pages/ (user_dashboard)
│   │
│   ├── markets/                       ~500
│   │   └── pages/ (MarketsAppPage)
│   │
│   └── mobile/                      removed in EPIC-1.8
│       └── React Native bridge + MobileAppRedirect deleted (PR #13347)
│
├── shared/                         ~28,000  18%    ~350 files  ← TRULY SHARED CODE
│   ├── components/
│   │   ├── component_kit/           15,570         ← design system (unchanged)
│   │   ├── sidebar/                  3,294
│   │   ├── SublayoutHeader/          1,959
│   │   ├── MarkdownEditor/           1,958
│   │   ├── Profile/                  2,070
│   │   ├── Privy/                     removed in EPIC-1.7 (PR #13348)
│   │   ├── menus/                      500
│   │   └── (20+ small shared components)
│   ├── hooks/                        1,200
│   │   ├── useNecessaryEffect.ts
│   │   ├── useFlag.ts
│   │   ├── useBrowserAnalyticsTrack.ts
│   │   ├── useAppStatus.ts
│   │   ├── useDraft.tsx
│   │   └── (11 more reusable hooks)
│   ├── utils/                        3,500
│   │   ├── general.ts (from helpers/index.tsx)
│   │   ├── formatting.ts
│   │   ├── constants.ts
│   │   ├── formValidations/
│   │   ├── clipboard.ts (consolidated)
│   │   └── (20+ utility modules)
│   ├── api/
│   │   └── trpcClient.ts
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Sublayout.tsx
│   │   └── SublayoutBanners.tsx
│   ├── modals/                         300
│   │   ├── confirmation_modal/
│   │   ├── TOSModal/
│   │   └── MobileSearchModal/
│   └── pages/                          200
│       ├── 404.tsx
│       ├── error.tsx
│       ├── terms.tsx
│       └── privacy.tsx
│
├── state/                          10,330   7%    289 files  ← UNCHANGED (already clean)
│   ├── api/                         9,292         ← React Query hooks stay here
│   └── ui/                            932         ← Zustand stores stay here
│
├── controllers/                    10,770   7%     73 files  ← UNCHANGED (chain/wallet adapters)
│
├── navigation/                      1,851   1%      5 files  ← updated lazy imports
│
├── models/                          2,168   1%     27 files  ← keep (or merge into shared/models/)
│
└── (root files: app.tsx, etc.)        ~130
```

---

### What Changes, What Doesn't

| Directory | Before | After | Change |
|-----------|--------|-------|--------|
| `views/` | 125,824 LOC (79%) | **0 LOC (deleted)** | Fully decomposed |
| `features/` | 0 | ~95,000 LOC (63%) | New -- all feature code lives here |
| `shared/` | 0 | ~28,000 LOC (18%) | New -- design system + reusable hooks/utils |
| `state/` | 10,330 | 10,330 | Unchanged |
| `controllers/` | 10,770 | 10,770 | Unchanged |
| `helpers/` | 5,036 | **0 (deleted)** | Absorbed into shared/utils/ + features/*/utils/ |
| `hooks/` | 1,970 | **0 (deleted)** | Absorbed into shared/hooks/ + features/*/hooks/ |
| `utils/` | 573 | **0 (deleted)** | Absorbed into shared/utils/ + shared/api/ |
| `stores/` | 384 | **0 (deleted)** | Dead or merged into state/ui/ |
| `navigation/` | 1,851 | 1,851 | Updated imports only |
| `models/` | 2,168 | 2,168 | Keep or merge |
| **Total** | **159,062** | **~152,000** | **~7k deleted (dead code)** |

---

### DevX Before vs After

| DevX Dimension | Before (Pre-hardening baseline) | After (End State) |
|----------------|-----------------|-------------------|
| **"Where do I put new code?"** | Guess: hooks/ vs helpers/ vs utils/ vs controllers/ vs state/? | **Clear:** `features/<name>/` for feature code, `shared/` for reusable code |
| **"Where is the Discussions feature?"** | Search 4+ directories: views/pages/discussions/, views/components/Comments/, hooks/useDraft.tsx, state/api/threads/, helpers/threads.ts | **One directory:** `features/discussions/` (pages, components, hooks, utils, modals) |
| **"Can I import from another feature?"** | No rules. CommunityManagement/Contests/ is imported by 17 files across 7 features | **Lint enforced:** `features/*` cannot import from `features/<other>/*`. Must go through `shared/` |
| **"What's the design system?"** | Buried at views/components/component_kit/ inside a 125k LOC views/ directory | **Top-level:** `shared/components/component_kit/` -- clearly separated |
| **"How do I test this component?"** | No component test harness; E2E-only fallback. | **Testing Library setup** with renderWithProviders, per-feature smoke tests, shared hook/util unit tests |
| **"What can I safely delete?"** | No idea. Import graph is tangled. | **Boundary lint rules** prevent new tangles. Dead code shows up as lint violations. |
| **"How big is each feature?"** | Unknown. Everything is in views/. | **Measurable:** `wc -l features/discussions/**` gives you the answer |
| **File count in a directory** | views/ has **1,496 files** | Largest feature dir has ~200 files. shared/ has ~350. |
| **Search noise** | `grep useFlag` returns results from views/, hooks/, helpers/, state/ | Organized by domain. Feature code is colocated. |
| **Onboarding a new dev** | "Here's views/. Good luck." | "Pick a feature directory. Everything you need is inside it." |
| **PR scope** | Hard to review -- cross-cutting changes touch 4+ directories | **Feature-scoped PRs** -- changes are colocated in one feature directory |

---

### Feature Size Distribution (After)

```
communities ████████████████████ 18k LOC  (largest -- includes admin sub-features)
discussions ██████████           10k LOC
governance  ████████              8k LOC
tokens      ██████▌               6.5k LOC
auth        █████▌                5.5k LOC
contests    █████▌                5.5k LOC
quests      █████                 5k LOC
wallet      █████                 5k LOC
explore     ████                  4k LOC
blockchain  ███▌                  3.5k LOC
admin       ██▌                   2.7k LOC
notificns   ██                    2k LOC
search      █                     1k LOC
mobile      █                     1k LOC
leaderboard ▌                     600 LOC
dashboard   ▌                     600 LOC
markets     ▌                     500 LOC
```

`communities/` is the largest because it absorbs 10.5k from CommunityManagement/ + 4.7k from GroupsAndMembers/ + 2k from CreateCommunity/ + 1k from CommunityHome/. Consider splitting into `communities/` (public) and `community-admin/` (management) if the team prefers smaller feature boundaries.

---

## Client-Side Workers Audit

Per the meeting note "must remove workers / things that don't / shouldn't remain":

**Found in client:**
- `client/public/firebase-messaging-sw.js` -- Firebase Cloud Messaging service worker for Knock push notifications. **Active/in-use.** Handles push event display and notification click routing. Should keep.
- `client/public/manifest.json` -- PWA manifest ("Common App", standalone display). Review with product whether PWA support is still desired.
- React Native bridge hooks/pages were removed in EPIC-1.8 (`PR #13347`); no `hooks/mobile/*` bridge code remains in current repo state.

**No traditional Web Workers or SharedWorkers found.** No `.worker.ts` files, no `new Worker()` calls.

**Action:** No additional client-side worker removals required. Keep Firebase SW as-is; review PWA manifest (`manifest.json`) with product if PWA support scope changes.

---

## 4. Deeper Architectural Refactors (Beyond File Moves)

The 58-ticket plan above reorganizes files. These are the **structural** problems that won't be fixed by moving files alone. Each is scoped as a potential follow-on epic or can be woven into the existing plan.

### A. Eliminate Global `app` Singleton → Zustand (HIGH PRIORITY)

**Problem:** `client/scripts/state/index.ts` exports a mutable global `app` object holding chain state, adapter readiness flags, and an EventEmitter. ~30+ files directly access `app.chain`, `app.activeChainId()`, `app.chainPreloading`, etc. This is invisible to React's render cycle -- mutations don't trigger re-renders unless something else does.

**Current shape:**
```
const app: IApp = {
  chain: null,
  activeChainId: () => app.chain?.id,
  chainPreloading: false,
  chainAdapterReady: new EventEmitter(),
  chainModuleReady: new EventEmitter(),
  isAdapterReady: false,
  ...
};
```

**Fix:** Create a `useChainStore` Zustand store in `state/ui/chain.ts`. Replace `app.chain` reads with `useChainStore.getState().chain` (outside React) or `useChainStore((s) => s.chain)` (inside React). Kill the EventEmitter -- Zustand subscriptions replace it.

**Scope:** ~30 files to update, ~500 LOC. Can be done as EPIC-2.5 (after shared infra, before feature migration) or as a standalone follow-on.

**Why it matters:** Without this, the feature migration just moves files that still depend on a global singleton. The `app` object is the #1 hidden coupling in the codebase.

---

### B. Route-Based Code Splitting with React.lazy (HIGH PRIORITY)

**Problem:** Zero code splitting exists today. All 60+ page components are eagerly imported in `CommonDomainRoutes.tsx` / `CustomDomainRoutes.tsx` / `GeneralRoutes.tsx`. The entire app loads on first paint.

**Current pattern:**
```typescript
import { Leaderboard } from 'views/pages/Leaderboard';
// ... 60+ more eager imports
```

**Fix:** Wrap every page import with `React.lazy()` + `<Suspense>`:
```typescript
const Leaderboard = lazy(() => import('features/leaderboard/pages/Leaderboard'));
```

**Best timing:** Do this in ticket **4.16** (update ALL route definitions) -- the imports are already being rewritten, so adding `lazy()` is near-zero marginal cost.

**Impact:** Could cut initial bundle size by 50-70%. Each feature becomes its own chunk. Vite handles the splitting automatically.

**Scope:** ~60 import lines changed, ~20 LOC for a shared `<Suspense>` fallback component. Minimal risk.

---

### C. Migrate controllers/ to React Hooks (MEDIUM PRIORITY -- Phase 2)

**Problem:** `controllers/` is 10,770 LOC across 73 files. These are legacy MVC-style controllers from a pre-React architecture. They:
- Mutate the global `app` object
- Mix blockchain adapter logic with UI state
- Are imported by 181+ files across the codebase

**Structure:**
```
controllers/
  app/              # login, notifications, web wallets (20+ files)
    webWallets/     # MetaMask, WalletConnect, Keplr, Phantom, etc.
  chain/            # Cosmos, Ethereum, Substrate adapters
  server/           # legacy server communication
```

**Fix (phased):**
1. **Wallet adapters** (`controllers/app/webWallets/`, ~20 files) → `features/wallet/adapters/` -- these are already feature-specific, just misplaced
2. **Chain adapters** (`controllers/chain/`, ~30 files) → `shared/chain/` or `features/blockchain/adapters/` -- pure logic, no React dependency
3. **Login/auth controllers** (`controllers/app/login.ts`, etc.) → absorb into `features/auth/` hooks
4. **Server communication** (`controllers/server/`) → replace with tRPC calls (most already have tRPC equivalents)

**Scope:** ~10,770 LOC. This is a full epic (call it **EPIC-7**). Should happen AFTER EPIC-6 (kill views/) to avoid two massive restructurings in flight.

**Why not now:** The current plan already moves 95k+ LOC. Adding controllers/ makes the plan too large. Better as a follow-on once feature boundaries are in place.

---

### D. Delete Legacy stores/ + models/ (MEDIUM PRIORITY)

**Problem:**
- `stores/` (8 files, ~384 LOC): Custom class-based array stores (`Store<T>` base class with `add/remove/getAll`). Not MobX, not Zustand -- a bespoke pattern. `PersistentStore` syncs to localStorage.
- `models/` (27 files, ~2,168 LOC): Class-based data models (`Account`, `Thread`, `Comment`, `Proposal`, `Topic`, etc.). These duplicate what React Query now provides as server state.

**What's still used:**
- `Account` model is used by auth controllers for wallet signing
- `IChainAdapter` / `IWebWallet` interfaces are used by chain/wallet controllers
- `ProposalStore`, `NewProfileStore` may still have live references

**Fix:**
1. `stores/` → Audit each for live references. Migrate any live state to Zustand stores in `state/ui/`. Delete the rest. (Part of EPIC-1 dead code or standalone.)
2. `models/` → Keep interfaces (`IChainAdapter`, `IWebWallet`). Delete data models that are now served by React Query types from `@hicommonwealth/schemas`. Migrate `Account` to a plain type + auth hook. (Part of EPIC-7 with controllers.)

**Scope:** ~2,550 LOC total. Low-risk deletions once references are verified.

---

### E. SCSS Scoping / CSS Modules (LOW PRIORITY -- Phase 3)

**Problem:** 584 SCSS files (~34,345 LOC) with global namespace. No CSS modules, no CSS-in-JS. Styles are "scoped" only by naming convention (`.ComponentName` class). This means:
- Any component can accidentally override another's styles
- No tree-shaking of unused CSS
- No compile-time guarantees of style isolation

**Current pattern:**
```tsx
import './CWButton.scss';  // global side effect import
```

**Options (pick one, not now):**
1. **CSS Modules** (lowest friction): Rename `.scss` → `.module.scss`, update imports. Vite supports this natively. Incremental -- can migrate one component at a time.
2. **Vanilla Extract / Panda CSS** (modern, zero-runtime): Higher migration cost but better DX long-term.
3. **Keep as-is** with stricter naming conventions: If the team isn't hitting style collision bugs, this is fine.

**Recommendation:** Don't include in the current plan. Revisit after EPIC-6 when the component structure is stable. If pursued, CSS Modules is the lowest-risk option since Vite already supports it and migration is incremental.

---

### F. Complete tRPC Migration (LOW PRIORITY)

**Problem:** 8 legacy REST route files (~852 LOC) remain in `server/routes/`:
- `ai/` -- AI-related endpoints
- `canvas/` -- Canvas.js signing
- `generateImage` -- Image generation
- `getUploadSignature` -- S3 upload signing
- `health` -- Health check
- `logout` -- Session logout

**Status:** tRPC migration is ~90% complete. These are specialized endpoints that may have reasons to stay as REST (file uploads, health checks).

**Recommendation:** Not a blocker. Address opportunistically. Health and upload routes may legitimately stay REST.

---

### What Goes Into Phase 1 (Current Plan, EPICs 1-6)

**Add A and B to the current plan.** They're small enough to weave in without disrupting the DAG:
- **A** becomes ticket 2.13 (blocked-by: 2.2), fits in EPIC-2 Lane D
- **B** is already natural inside ticket 4.16

**Defer C, D, E** to Phase 2 (below). Don't touch tRPC -- it's 90% done and the remaining REST routes are legitimate.

---

## 5. Phase 2 Roadmap: 10/10 DevX

Phase 1 (EPICs 1-6) delivers **feature-sliced architecture**. That gets DevX from ~5/10 to ~7/10. Phase 2 tackles the remaining structural debt + tooling gaps to reach 10/10.

### Current DevX Scorecard (audited)

| Area | Today | After Phase 1 | After Phase 2 |
|------|-------|--------------|---------------|
| Code organization | 3/10 | **8/10** | 9/10 |
| Error resilience | 2/10 | 2/10 | **8/10** |
| TypeScript strictness | 4/10 | 4/10 | **8/10** |
| Component documentation | 3/10 | 3/10 | **8/10** |
| API mocking (dev/test) | 0/10 | 0/10 | **8/10** |
| Bundle performance | 4/10 | **7/10** (lazy routes) | **9/10** |
| Build system / caching | 5/10 | 5/10 | **8/10** |
| Git workflow | 7/10 | 7/10 | **9/10** |
| Developer docs | 4/10 | 4/10 | **8/10** |
| HMR / dev server | 8/10 | 8/10 | 9/10 |
| Import hygiene | 5/10 | **8/10** | **9/10** |
| Debugging DX | 7/10 | 7/10 | **9/10** |
| Testing DX | 3/10 | **6/10** | **9/10** |
| Legacy code burden | 2/10 | **5/10** | **9/10** |
| **Overall** | **~4/10** | **~6/10** | **~9/10** |

---

### EPIC-7: Migrate controllers/ + Kill Legacy State (Phase 2, ~3 weeks)

The biggest remaining structural debt after Phase 1. 10,770 LOC of MVC controllers + 2,550 LOC of legacy stores/models.

```
EPIC-7: Migrate controllers/ + Kill Legacy State
│
├── 7.1: Migrate wallet adapters to features/wallet/adapters/ [PARALLEL]
│   files: controllers/app/webWallets/ (~20 files)
│   ~3,500 LOC move
│   blocked-by: EPIC-6 (Phase 1 complete)
│
├── 7.2: Migrate chain adapters to shared/chain/ [PARALLEL]
│   files: controllers/chain/ (~30 files, Cosmos/Ethereum/Substrate/Near/Solana)
│   ~4,500 LOC move
│   blocked-by: EPIC-6
│
├── 7.3: Absorb login/auth controllers into features/auth/ hooks [blocked-by: 7.1]
│   files: controllers/app/login.ts, controllers/app/notification_settings.ts, etc.
│   Replace imperative controller calls with React hooks + tRPC mutations
│   ~1,500 LOC refactor
│
├── 7.4: Delete controllers/server/ (replaced by tRPC) [PARALLEL w/ 7.3]
│   Verify each function has a tRPC equivalent. Delete confirmed dead code.
│   ~1,200 LOC delete
│
├── 7.5: Migrate live stores/ to Zustand [blocked-by: 7.1, 7.2]
│   Audit: AccountsStore, ProposalStore, NewProfileStore, PersistentStore
│   Move live state → state/ui/<name>.ts as Zustand stores
│   Delete Store.ts, IdStore.ts base classes
│   ~384 LOC delete/refactor
│
├── 7.6: Migrate live models/ to types + hooks [blocked-by: 7.3, 7.5]
│   Keep: IChainAdapter, IWebWallet interfaces → shared/types/
│   Delete: Thread, Comment, Proposal, Topic class models (React Query replaces)
│   Migrate: Account class → plain type + useAccount hook
│   ~2,168 LOC refactor/delete
│
├── 7.7: Delete controllers/, stores/, models/ directories [blocked-by: 7.1-7.6]
│   Remove vite/tsconfig aliases for controllers, models, stores
│   ~20 LOC modify
│
└── 7.8: Update consumer imports + verify [blocked-by: 7.7]
    ~181 files import from controllers/
    ~93 files import from models/
    pnpm -F commonwealth bundle + check-types + test-unit
    ~300 LOC modify

Parallelism: max 3 lanes (7.1, 7.2, 7.4 run simultaneously)
Sequential depth: 5 (7.1 → 7.3 → 7.6 → 7.7 → 7.8)
```

---

### EPIC-8: Error Boundaries + Resilience (~1 week)

**Problem:** Single top-level `<ErrorBoundary>` in Layout.tsx. Any uncaught error crashes the entire app UI. No granular recovery.

```
EPIC-8: Error Boundaries
│
├── 8.1: Create shared ErrorBoundary components [no deps]
│   new: shared/components/FeatureErrorBoundary.tsx
│         -- renders inline error card with "Retry" button
│   new: shared/components/RouteErrorBoundary.tsx
│         -- renders full-page error with nav intact
│   Uses react-error-boundary (already installed)
│   ~200 LOC new
│
├── 8.2: Wrap each feature route with RouteErrorBoundary [blocked-by: 8.1]
│   Modify: navigation/CommonDomainRoutes.tsx, CustomDomainRoutes.tsx
│   Each <Route> gets errorElement={<RouteErrorBoundary />}
│   ~60 LOC modify
│
├── 8.3: Add FeatureErrorBoundary to high-risk components [blocked-by: 8.1] [PARALLEL w/ 8.2]
│   Targets: wallet connection flows, blockchain interactions,
│            third-party integrations (Knock, Discord, Quill/Lexical editors)
│   ~15 boundaries, ~100 LOC modify
│
└── 8.4: Add error logging to boundaries [blocked-by: 8.2, 8.3]
    Connect onError callback to analytics (useBrowserAnalyticsTrack)
    ~50 LOC modify
```

---

### EPIC-9: TypeScript Strict Mode (~2 weeks)

**Problem:** Only `strictNullChecks` enabled. No `strict: true`. 210 `any` usages across 114 files. Missing `noUncheckedIndexedAccess`, `noImplicitAny`, `strictFunctionTypes`.

```
EPIC-9: TypeScript Strict Mode
│
├── 9.1: Enable strict: true in tsconfig with per-file overrides [no deps]
│   Strategy: Enable strict, add // @ts-expect-error for existing violations
│   Use ts-strict-plugin or manual triage to avoid blocking all PRs
│   ~50 LOC modify (tsconfig + overrides)
│
├── 9.2: Fix `any` types in shared/ (~40 files) [blocked-by: 9.1]
│   Replace `any` with proper types, `unknown`, or generics
│   ~200 LOC modify
│
├── 9.3: Fix `any` types in features/ (~60 files) [blocked-by: 9.1] [PARALLEL w/ 9.2]
│   Split across features, can be parallelized per feature
│   ~400 LOC modify
│
├── 9.4: Fix `any` types in state/ + controllers/ (~14 files) [PARALLEL w/ 9.2-9.3]
│   ~100 LOC modify
│
└── 9.5: Enable noUncheckedIndexedAccess + clean up [blocked-by: 9.2-9.4]
    Adds `| undefined` to array/object index access
    ~200 LOC modify
```

---

### EPIC-10: Storybook + Component Documentation (~2 weeks)

**Problem:** Zero `.stories.tsx` files. Custom ComponentsShowcase exists but is manual and not integrated with standard tooling. No visual regression testing.

```
EPIC-10: Storybook
│
├── 10.1: Install and configure Storybook 8 [no deps]
│   deps: @storybook/react-vite, @storybook/addon-essentials
│   config: .storybook/main.ts, .storybook/preview.ts
│   Include theme provider, router stubs, mock providers
│   ~150 LOC new
│
├── 10.2: Write stories for component_kit (core design system) [blocked-by: 10.1]
│   ~30 components: CWButton, CWText, CWCard, CWModal, CWTable, CWTag, etc.
│   ~1,500 LOC new (.stories.tsx files)
│
├── 10.3: Write stories for shared components [blocked-by: 10.1] [PARALLEL w/ 10.2]
│   sidebar, SublayoutHeader, MarkdownEditor, Profile
│   ~500 LOC new
│
├── 10.4: Connect Chromatic CI (already has workflow file) [blocked-by: 10.2]
│   Update .github/workflows/chromatic.yml to run on all PRs touching shared/
│   Enable visual regression detection
│   ~30 LOC modify
│
└── 10.5: Delete ComponentsShowcase pages [blocked-by: 10.2]
    Already marked as dead code in EPIC-1, but defer if Storybook isn't ready yet
    ~2,432 LOC delete
```

---

### EPIC-11: MSW + API Mocking Layer (~1 week)

**Problem:** No structured API mocking. Tests rely on real backends or ad-hoc jest.mock() calls. No way to develop frontend features before backend is ready.

```
EPIC-11: MSW Setup
│
├── 11.1: Install MSW + configure handlers [no deps]
│   deps: msw
│   new: test/mocks/handlers.ts (tRPC mock handlers for common queries)
│   new: test/mocks/server.ts (test setup)
│   new: test/mocks/browser.ts (dev setup, optional)
│   ~300 LOC new
│
├── 11.2: Integrate MSW with component test setup [blocked-by: 11.1]
│   Modify: test/component/setup.ts to start MSW server
│   Replace manual trpcClient mocks with MSW interceptors
│   ~100 LOC modify
│
├── 11.3: Write mock data factories [blocked-by: 11.1] [PARALLEL w/ 11.2]
│   new: test/mocks/factories/ (thread, community, user, proposal factories)
│   Use @faker-js/faker or plain builder functions
│   ~400 LOC new
│
└── 11.4: Add MSW to Storybook (if EPIC-10 done) [blocked-by: 11.1, 10.1]
    new: .storybook/msw-addon config
    Allows stories to render with realistic mock data
    ~50 LOC new
```

---

### EPIC-12: Build System + Performance (~1 week)

**Problem:** No Turborepo/Nx for build caching. No performance budgets. Bundle analyzer exists but is manual. No Lighthouse CI.

```
EPIC-12: Build System + Performance
│
├── 12.1: Add Turborepo for build/test caching [no deps]
│   new: turbo.json with pipeline for build, check-types, test-unit, lint
│   Enable remote caching (Vercel or self-hosted)
│   Incremental builds -- only rebuild changed packages
│   ~100 LOC new
│
├── 12.2: Add bundle size budgets to Vite [no deps] [PARALLEL w/ 12.1]
│   new: vite config rollupOptions.output.manualChunks for vendor splitting
│   Add bundlesize or size-limit check in CI
│   Target: main chunk < 200KB, vendor < 500KB, total < 2MB
│   ~80 LOC new/modify
│
├── 12.3: Add Lighthouse CI to PR checks [blocked-by: 12.2]
│   new: .lighthouserc.js with performance budgets
│   CI step: run lighthouse on staging URL after deploy
│   Fail PR if LCP > 2.5s, CLS > 0.1, FID > 100ms
│   ~100 LOC new
│
├── 12.4: Prune barrel files (447 → <100) [blocked-by: EPIC-6]
│   Remove index.ts barrel exports that re-export everything
│   Keep only barrels for public API of features/ and shared/
│   Use eslint-plugin-barrel-files or manual audit
│   ~400 LOC delete
│
└── 12.5: Add client-side structured logging [no deps] [PARALLEL]
    new: shared/utils/logger.ts (Pino browser or custom)
    Replace console.log/error calls with structured logger
    Enable log levels per environment (debug in dev, error in prod)
    ~150 LOC new, ~100 LOC modify
```

---

### EPIC-13: Git Workflow + Developer Docs (~3 days)

**Problem:** No commitlint/conventional commits. No CONTRIBUTING.md. No ADRs. Husky hooks exist but are basic.

```
EPIC-13: Git Workflow + Docs
│
├── 13.1: Add commitlint + conventional commits [no deps]
│   deps: @commitlint/cli, @commitlint/config-conventional
│   new: commitlint.config.js
│   Modify: .husky/commit-msg hook
│   Format: feat(discussions): add thread sorting
│   ~50 LOC new
│
├── 13.2: Add lint-staged (replace custom pre-commit script) [PARALLEL w/ 13.1]
│   deps: lint-staged
│   Replace scripts/pre-commit.sh with lint-staged config
│   Run: prettier on staged files, eslint on staged .ts/.tsx
│   ~30 LOC new/modify
│
├── 13.3: Write CONTRIBUTING.md [PARALLEL w/ 13.1]
│   Sections: Setup, Feature development workflow, PR guidelines,
│             Feature directory conventions, Testing expectations,
│             Import rules (features can't cross-import)
│   ~200 LOC new
│
├── 13.4: Write ADR-001: Feature-Sliced Architecture [PARALLEL w/ 13.1]
│   new: docs/adr/001-feature-sliced-architecture.md
│   Document: why feature dirs, boundary rules, shared vs feature decision criteria
│   ~150 LOC new
│
├── 13.5: Write ADR-002: State Management Strategy [PARALLEL]
│   new: docs/adr/002-state-management.md
│   Document: React Query for server state, Zustand for UI state,
│             why not Redux/MobX, when to use each
│   ~100 LOC new
│
└── 13.6: Add feature scaffolding CLI [blocked-by: EPIC-6]
    new: scripts/create-feature.ts
    Generates: features/<name>/{pages,components,hooks,utils,modals}/
    + barrel index.ts, + README.md template
    ~200 LOC new
```

---

### EPIC-14: CSS Modules Migration (~3 weeks, optional)

**Problem:** 584 SCSS files with global namespace. Only pursued if the team hits style collision issues.

```
EPIC-14: CSS Modules (optional)
│
├── 14.1: Configure Vite for .module.scss [no deps]
│   Vite supports CSS modules natively -- just rename files
│   Add typed-scss-modules for TypeScript support
│   ~30 LOC modify
│
├── 14.2: Migrate component_kit/ to CSS modules [blocked-by: 14.1]
│   ~155 files, incremental (one component at a time)
│   ~15,570 LOC modify (rename imports + className usage)
│
├── 14.3: Migrate shared/components/ to CSS modules [blocked-by: 14.1] [PARALLEL w/ 14.2]
│   ~50 files
│   ~5,000 LOC modify
│
└── 14.4: Migrate feature/ component styles [blocked-by: 14.1] [PARALLEL w/ 14.2-14.3]
    Incremental per feature, can be spread across team
    ~379 files remaining
```

---

### Phase 2 DAG (Epic-Level)

Ordered by priority. Storybook + CSS Modules deferred to end.

```
EPIC-6 done (Phase 1 complete)
         │
         │  WAVE A -- Structural debt (start immediately)
    ┌────┼────┬─────┬─────┐
    v    v    v     v     v
  E-7  E-8  E-9  E-12  E-13
 (ctrl)(err)(TS) (build)(docs)
    │              │
    v              v
  E-7.8          E-12.4
 (verify)       (barrel prune)
                    │
         │  WAVE B -- Testing DX (after build infra)
         │          │
         v          v
       E-11 ←───── (needs test infra from Phase 1)
       (MSW)
         │
         │  WAVE C -- Component documentation (last)
         v
       E-10
     (storybook)
         │
         v
       E-11.4
     (MSW+SB)
         │
         │  WAVE D -- Optional
         v
       E-14
     (CSS mod)

WAVE A: 5 epics in parallel (E-7, E-8, E-9, E-12, E-13)
WAVE B: E-11 (MSW) -- can start anytime, but best after Wave A
WAVE C: E-10 (Storybook) -- intentionally last, lowest priority
WAVE D: E-14 (CSS Modules) -- optional, only if style collisions are a problem
```

### Phase 2 Summary Table (priority order)

| Priority | Epic | Tickets | Effort | Max Parallel | Dependencies |
|----------|------|---------|--------|-------------|--------------|
| **P0** | 7: controllers/stores/models | 8 | ~3 weeks | 3 | Phase 1 complete |
| **P0** | 8: Error boundaries | 4 | ~1 week | 2 | None |
| **P0** | 9: TypeScript strict | 5 | ~2 weeks | 3 | None |
| **P1** | 12: Build/perf | 5 | ~1 week | 3 | Phase 1 for 12.4 |
| **P1** | 13: Git workflow/docs | 6 | ~3 days | 5 | Phase 1 for 13.6 |
| **P1** | 11: MSW | 4 | ~1 week | 2 | None |
| **P2** | 10: Storybook | 5 | ~2 weeks | 2 | None |
| **P3** | 14: CSS Modules (optional) | 4 | ~3 weeks | 3 | None |
| | **Total Phase 2** | **41** | **~10 weeks** | **6** | -- |

### Combined Phases: Full Picture

| Phase | Epics | Tickets | Scope |
|-------|-------|---------|-------|
| **Phase 1** (EPICs 1-6) | 6 | 58 | Feature-sliced architecture, file moves, test infra, boundary enforcement |
| **Phase 2** (EPICs 7-14) | 8 | 41 | Legacy code kill, strict types, error boundaries, MSW, build caching, docs, Storybook |
| **Total** | **14** | **99** | **~4/10 → ~9/10 DevX** |

Phase 2 can start as soon as EPIC-6 completes for EPIC-7 and EPIC-12.4. EPICs 8, 9, 11, 13 have **no dependency on Phase 1** -- they can start in parallel with Phase 1 if the team has bandwidth. Hard ordering:
- EPIC-7 (controllers) requires feature dirs → needs Phase 1
- EPIC-12.4 (barrel prune) requires files in final locations → needs Phase 1
- EPIC-13.6 (scaffolding CLI) requires feature dir conventions → needs Phase 1
- EPIC-10 (Storybook) intentionally last -- lower priority than structural fixes
- EPIC-14 (CSS modules) optional, wait for component structure to stabilize

---

## Critical Files

- `packages/commonwealth/client/vite.config.ts` -- resolve aliases
- `packages/commonwealth/tsconfig.json` -- path mappings
- `packages/commonwealth/client/scripts/navigation/CommonDomainRoutes.tsx` -- 60+ lazy imports
- `views/pages/CommunityManagement/Contests/useCommunityContests.ts` -- tightest cross-feature coupling (17 consumers)
- `.eslintrc.cjs` -- boundary enforcement

## Verification

After each epic:
1. `pnpm -r check-types` passes
2. `pnpm -F commonwealth bundle` succeeds
3. `pnpm -F commonwealth test-unit` passes
4. `pnpm -F commonwealth test-e2e-smoke --forbid-only` passes
5. `pnpm -F commonwealth test-component` passes (after EPIC-2)
6. `pnpm lint-diff` clean

Final verification (EPIC-6):
- `pnpm depcruise:circular` (new script) -- no circular dependencies
- `pnpm -F commonwealth test-e2e` passes
- `pnpm -F commonwealth test-e2e-serial` passes
- `pnpm -F commonwealth test-e2e-mature` passes
- `pnpm -F commonwealth test-visual` passes in compare mode
- No `views/` directory exists
- No deprecated re-export stubs remain
- No legacy aliases/imports remain (`views`, `helpers`, `hooks`, `controllers`, `models`)
- Release-candidate promotion has explicit human sign-off

## Change Log

- 260202: Updated by Codex; moved plan into Common Knowledge and added status section.
- 260216: Updated by Codex with automation-first testing policy decisions (visual baseline gating, nightly+RC mature E2E, staged boundary enforcement, and human-in-the-loop approvals).
