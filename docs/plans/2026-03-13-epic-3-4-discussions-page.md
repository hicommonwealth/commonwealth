# EPIC-3.4 DiscussionsPage Implementation Plan

**Goal:** Split `DiscussionsPage` into a route/filter controller, feed-rendering module, and sticky-composer shell without changing discussions behavior.

**Architecture:** Keep `DiscussionsPage.tsx` as a thin composition layer and move route/query/filter/create-thread orchestration into `useDiscussionsData.ts`. Render the page through focused modules for shared shell chrome, feed mode switching, private-topic fallback, and sticky composer while preserving the existing `HeaderWithFilters` ownership.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Router, React Query, react-virtuoso

---

### Task 1: Extract the route/filter controller

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/discussions/useDiscussionsData.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPage.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/discussionsPage.contracts.ts`

**Step 1: Move fetch/state/effect orchestration into `useDiscussionsData.ts`**

Keep the current route contract intact:
- parse `stage`, `featured`, `dateRange`, `contest`, and `tab`
- preserve topic validation redirects
- preserve archive page detection, gating checks, contests lookup, weighted-topic banner data, and sticky thread creation flow
- keep `selectedView`, `filteredThreads`, and `totalThreadCount` aligned with URL/filter behavior

**Step 2: Reduce `DiscussionsPage.tsx` to a composition boundary**

Keep the top-level page responsible only for:
- wiring the sticky comment provider
- choosing between the private-topic fallback and the normal discussions content
- composing header, feed, sticky composer, and sticky selector modules

### Task 2: Split feed and shell rendering

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageShell.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageFeed.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageComposer.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPagePrivateTopic.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageGridComponents.tsx`

**Step 1: Move shared layout chrome into `DiscussionsPageShell.tsx`**

Keep the shell responsible for:
- `CWPageLayout`
- feed discovery, breadcrumbs, onboarding/training sliders
- weighted-topic token banner
- gated-topic banner

**Step 2: Move list/grid/overview switching into `DiscussionsPageFeed.tsx`**

Keep the feed module responsible for:
- `Virtuoso` list mode
- `VirtuosoGrid` card mode
- `OverviewPage` handoff
- preserving `RenderThreadCard` behavior and infinite-scroll wiring

**Step 3: Move sticky composer and private-topic fallback into focused modules**

Keep:
- private-topic info state in `DiscussionsPagePrivateTopic.tsx`
- sticky thread composer shell in `DiscussionsPageComposer.tsx`
- virtualized grid component definitions out of the main page render tree

### Task 3: Extend discussions contracts

**Files:**
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/discussionsPage.contracts.ts`
- Modify: `packages/commonwealth/test/unit/epic3/discussionsPage.contracts.spec.ts`

**Step 1: Add pure helpers for the split seams**

Cover:
- feed variant selection by `selectedView`
- whether list queries should run for the selected view
- archive vs non-archive thread-count sourcing

**Step 2: Keep EPIC-3 contract coverage focused and pure**

Extend the existing contract suite instead of adding a heavy component harness in the same change.

### Task 4: Verify and document

**Run:**
- `pnpm exec eslint --max-warnings=0 <task-owned files>`
- `pnpm lint-diff`
- `pnpm -F commonwealth no-legacy-imports`
- `pnpm -F commonwealth no-stub-imports`
- `pnpm -F commonwealth check-types`
- `pnpm -F commonwealth bundle`
- `pnpm -F commonwealth test-select test/unit/epic3/discussionsPage.contracts.spec.ts test/unit/epic3/viewThreadPage.contracts.spec.ts`
- `pnpm -F commonwealth lint-boundaries`

**Step 1: Fix task-local regressions**

Treat unrelated repo-wide blockers as blockers only when they are unchanged by the split.

**Step 2: Update docs if EPIC scope changes**

If the split reveals a real EPIC-3 or EPIC-4 sequencing change, update `common_knowledge/Commonwealth-Frontend-Refactor-Plan.md` before closing the task.

---

## Outcome

- `DiscussionsPage.tsx` is now a thin composition layer instead of owning route parsing, query wiring, feed switching, and sticky composer behavior inline.
- The page orchestration moved into `packages/commonwealth/client/scripts/views/pages/discussions/useDiscussionsData.ts`.
- Shared layout chrome now lives in `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageShell.tsx`.
- Feed switching is isolated in `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageFeed.tsx`.
- Sticky thread creation moved into `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageComposer.tsx`.
- The private-topic fallback now lives in `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPagePrivateTopic.tsx`.
- Virtualized grid helper components moved out of the main page render path into `packages/commonwealth/client/scripts/views/pages/discussions/DiscussionsPageGridComponents.tsx`.
- `discussionsPage.contracts.ts` now also owns pure helpers for feed mode selection, thread-fetch gating, and archive count behavior.
- `HeaderWithFilters.tsx` now uses a local weighted-topic typing shim so the discussions split does not keep reintroducing `secondary_tokens` type errors from this page boundary.

## Verification

- Strict ESLint on task-owned EPIC-3.4 files
  - passed
- `pnpm -F commonwealth no-legacy-imports`
  - passed
- `pnpm -F commonwealth no-stub-imports`
  - passed
- `pnpm lint-diff`
  - passed with the same non-failing ignored-test warnings already present on this branch
- `pnpm -F commonwealth check-types`
  - still fails repo-wide on unrelated blockers
  - no task-local failures remain in:
    - `DiscussionsPage.tsx`
    - `useDiscussionsData.ts`
    - `DiscussionsPageShell.tsx`
    - `DiscussionsPageFeed.tsx`
    - `DiscussionsPageComposer.tsx`
    - `DiscussionsPageGridComponents.tsx`
    - `HeaderWithFilters.tsx`
  - remaining discussions-area errors are pre-existing in unchanged leaves:
    - `client/scripts/views/pages/discussions/CommentTree/TreeHierarchy.tsx` (`triggered_by_user_id`)
    - `client/scripts/views/pages/discussions/ThreadCard/ThreadCard.tsx` (`isValidImageUrl`)
- `pnpm -F commonwealth bundle`
  - blocked by the same unrelated repo-wide build error as EPIC-3.1 through EPIC-3.3:
    - `libs/evm-protocols/src/event-registry/eventRegistry.ts`
    - missing `BinaryVaultAbi` export from `@commonxyz/common-protocol-abis`
- `pnpm -F commonwealth test-select test/unit/epic3/discussionsPage.contracts.spec.ts test/unit/epic3/viewThreadPage.contracts.spec.ts`
  - blocked by the shared local Vitest DB bootstrap because Postgres.app rejects trust authentication for Codex
- `pnpm -F commonwealth lint-boundaries`
  - still blocked locally because `eslint-plugin-boundaries` is not resolvable in this environment

## Lessons Learned

- `selectedView` and `filteredThreads` are safer as pure route/data derivations than as page-local synchronization effects. The split becomes smaller and less fragile when the page controller owns that contract.
- `react-virtuoso` helper components need library-compatible optional `children` props; otherwise the split introduces avoidable type churn in the grid seam.
- The discussions split can absorb the `secondary_tokens` typing workaround locally in page-boundary code without expanding EPIC-3.4 into a broader topic-model migration.
