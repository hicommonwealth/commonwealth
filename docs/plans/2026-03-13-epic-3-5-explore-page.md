# EPIC-3.5 ExplorePage Implementation Plan

**Goal:** Split `ExplorePage` into a tab shell, page controller hook, and explicit section renderer without changing tab, search, prediction-market, or community-stake modal behavior.

**Architecture:** Keep `ExplorePage.tsx` as a thin orchestrator that composes a route/search/data hook with a shell for the shared header and tabs plus a content switch for section-level surfaces. Treat `Markets` and `Prediction Markets` as explicit first-class sections in the split, while preserving the existing `AllTabContent` and `CommunitiesList` ownership boundaries.

**Tech Stack:** React, TypeScript, React Router, Vitest, Vite

---

### Task 1: Extract the page controller

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/ExplorePage/useExploreData.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePage.tsx`

**Step 1: Move route/search/query/modal state into `useExploreData.ts`**

Keep the current behavior intact:
- parse `tab` from the URL and default to `all`
- preserve feature-flag-controlled tab visibility for `markets` and `prediction-markets`
- preserve search state and clear-search behavior
- preserve community-stake modal wiring, denomination lookup input, and selected community state
- preserve historical stake-price and ETH/USD query wiring for the communities tab

**Step 2: Reduce `ExplorePage.tsx` to a composition boundary**

Keep the top-level page responsible only for:
- composing the shell, content, and modal modules
- passing through the state returned by `useExploreData.ts`

### Task 2: Split shell and section rendering

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageShell.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageContent.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageManageCommunityStakeModal.tsx`

**Step 1: Move shared header and tab chrome into `ExplorePageShell.tsx`**

Keep the shell responsible for:
- `CWPageLayout`
- `IdeaLaunchpad`
- search input
- tab row rendering and navigation callbacks

**Step 2: Move tab-specific rendering into `ExplorePageContent.tsx`**

Keep the content module responsible for:
- explicit section selection for `all`, `communities`, `users`, `contests`, `threads`, `quests`, `tokens`, `markets`, and `prediction-markets`
- preserving `ThreadFeed` query wiring
- keeping prediction-market discovery as a first-class section instead of inline page internals

**Step 3: Isolate the stake modal**

Keep `ExplorePageManageCommunityStakeModal.tsx` responsible for:
- `CWModal`
- `ManageCommunityStakeModal`
- denomination lookup and close behavior only

### Task 3: Refresh focused coverage

**Files:**
- Modify: `packages/commonwealth/test/component/pages/explorePage.integration.spec.tsx`

**Step 1: Preserve the existing shell and routing smoke coverage**

Keep the existing checks for:
- all-tab shell rendering
- route navigation when tabs switch
- markets/quests rendering

**Step 2: Add explicit prediction-market coverage**

Extend the integration spec to cover:
- `prediction-markets` tab rendering when `futarchy` is enabled
- presence of the prediction-markets tab button in the split shell

### Task 4: Verify and document

**Run:**
- `pnpm exec eslint --max-warnings=0 packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePage.tsx packages/commonwealth/client/scripts/views/pages/ExplorePage/useExploreData.ts packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageShell.tsx packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageContent.tsx packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageManageCommunityStakeModal.tsx`
- `pnpm -F commonwealth test-component -- test/component/pages/explorePage.integration.spec.tsx`
- `pnpm lint-diff`
- `pnpm -F commonwealth check-types`
- `pnpm -F commonwealth bundle`
- `pnpm -F commonwealth no-legacy-imports`
- `pnpm -F commonwealth no-stub-imports`
- `pnpm -F commonwealth lint-boundaries`

**Step 1: Fix task-local regressions**

Treat repo-wide blockers as blockers only when they changed because of the Explore split.

**Step 2: Update EPIC docs only if sequencing changes**

If the split changes EPIC-3/EPIC-4 sequencing, update `common_knowledge/Commonwealth-Frontend-Refactor-Plan.md` before closing the task.

---

## Outcome

- `ExplorePage.tsx` is now a thin composition boundary instead of owning route parsing, feature flags, search state, query wiring, conditional tab rendering, and modal markup inline.
- The page controller moved into `packages/commonwealth/client/scripts/views/pages/ExplorePage/useExploreData.ts`.
- Shared Explore header/tab chrome now lives in `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageShell.tsx`.
- Tab-specific section selection now lives in `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageContent.tsx`.
- Community stake modal rendering now lives in `packages/commonwealth/client/scripts/views/pages/ExplorePage/ExplorePageManageCommunityStakeModal.tsx`.
- Prediction-market discovery is now an explicit first-class branch in the section renderer instead of being embedded directly in the page component.
- `packages/commonwealth/test/component/pages/explorePage.integration.spec.tsx` now includes focused prediction-market tab coverage in addition to the existing shell and route smoke checks.

## Verification

- Strict ESLint on task-owned EPIC-3.5 page files
  - passed
- `pnpm -F commonwealth test-component -- test/component/pages/explorePage.integration.spec.tsx`
  - blocked by the current component-test environment before tests execute
  - Vitest cannot resolve `@testing-library/jest-dom/vitest` from `packages/commonwealth/test/component/setup.ts`
- `pnpm lint-diff`
  - passed with the same ignored-test warnings already present on this branch
- `pnpm -F commonwealth check-types`
  - still fails repo-wide on existing blockers
  - no task-local failures remain in:
    - `ExplorePage.tsx`
    - `useExploreData.ts`
    - `ExplorePageShell.tsx`
    - `ExplorePageContent.tsx`
    - `ExplorePageManageCommunityStakeModal.tsx`
  - remaining Explore-area failures are pre-existing in unchanged surfaces such as:
    - `client/scripts/views/pages/ExplorePage/MarketsList/MarketsList.tsx` (`useInfiniteQuery`)
- `pnpm -F commonwealth bundle`
  - still fails on the existing repo-wide `BinaryVaultAbi` export error in `libs/evm-protocols/src/event-registry/eventRegistry.ts`
- `pnpm -F commonwealth no-legacy-imports`
  - initially failed on newly introduced `views/*` aliases in the split shell/modal modules
  - passed after repointing those imports back to local relative paths
- `pnpm -F commonwealth no-stub-imports`
  - passed
- `pnpm -F commonwealth lint-boundaries`
  - still blocked locally because `eslint-plugin-boundaries` is not resolvable in this environment

## Lessons Learned

- `ExplorePage` splits cleanly when the page owns only URL/search/modal orchestration and the section renderer owns the surface switch. That leaves later feature migration work with a clear shell boundary.
- Prediction-market discovery should stay explicit in the content switch even before the full EPIC-4 move; hiding it inside a generic “all tabs” branch would keep the newest discovery surface unowned.
- The repo’s component-test environment is currently broken at setup resolution, so component coverage work needs to be validated against environment blockers before using failing test runs as signal on page-level refactors.
