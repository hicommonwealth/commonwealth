# EPIC-3.3 ViewThreadPage Implementation Plan

**Goal:** Split `ViewThreadPage` into a route/data controller, content shell, and sidebar/composer modules without changing thread-detail behavior.

**Architecture:** Keep `ViewThreadPage.tsx` as the route boundary and move the page orchestration into `useViewThreadData.ts` plus focused render modules for shell, body, sub-body, sidebars, and sticky composer. Preserve existing child ownership for polls, comments, snapshot/proposal cards, and prediction-market cards while removing the top-level page monolith.

**Tech Stack:** React, TypeScript, Vitest, Vite, React Router, tRPC React Query hooks

---

### Task 1: Extract the route/data controller

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/view_thread/useViewThreadData.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/view_thread/ViewThreadPage.tsx`

**Step 1: Move fetch/state/effect orchestration into `useViewThreadData.ts`**

Keep the current route contract intact:
- parse `identifier`
- fetch thread, polls, token, content-url body, voter profiles
- derive snapshot/cosmos governance state
- keep edit/composer/global-edit state in one place
- preserve `thread_not_found` semantics based on `thread.communityId === app.activeChainId()`

**Step 2: Reduce `ViewThreadPage.tsx` to the route controller**

Keep the top-level render state contract stable:
- `fetch_error` -> `PageNotFound`
- `loading` -> `CWContentPage` skeleton
- `thread_not_found` -> `PageNotFound`
- `ready` -> shell component

### Task 2: Split the render shell into focused modules

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/view_thread/ViewThreadPageShell.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/view_thread/ViewThreadPageBody.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/view_thread/ViewThreadPageSubBody.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/view_thread/ViewThreadPageComposer.tsx`
- Create: `packages/commonwealth/client/scripts/views/pages/view_thread/viewThreadPageSidebars.tsx`

**Step 1: Move `CWContentPage` wiring into `ViewThreadPageShell.tsx`**

Keep the page shell responsible for:
- meta tags / canonical URL
- `CWContentPage` wiring
- `CommentTree`
- image action modal
- join-community modals

**Step 2: Move the large inline render branches into dedicated modules**

Split:
- thread body / edit / lock / banner rendering into `ViewThreadPageBody.tsx`
- snapshot / proposal / mobile actions rendering into `ViewThreadPageSubBody.tsx`
- sticky composer wrapper into `ViewThreadPageComposer.tsx`
- sidebar and proposal-detail section assembly into `viewThreadPageSidebars.tsx`

**Step 3: Keep prediction-market thread surfaces inside explicit sidebar modules**

Do not change the existing prediction-market leaf components. Only remove their wiring from the top-level page monolith.

### Task 3: Extend page contracts for the new seams

**Files:**
- Modify: `packages/commonwealth/client/scripts/views/pages/view_thread/viewThreadPage.contracts.ts`
- Modify: `packages/commonwealth/test/unit/epic3/viewThreadPage.contracts.spec.ts`

**Step 1: Add pure helpers for extracted shell decisions**

Cover:
- join-community banner visibility
- gated-topic banner visibility
- desktop-only sidebar visibility

**Step 2: Keep the split guarded by pure contract tests**

Extend the existing EPIC-3 contract suite instead of introducing a heavy route integration harness in the same change.

### Task 4: Verify and document

**Run:**
- `pnpm -F commonwealth exec eslint --max-warnings=0 <task-owned files>`
- `pnpm -F commonwealth check-types`
- `pnpm -F commonwealth bundle`
- `pnpm -F commonwealth test-select test/unit/epic3/viewThreadPage.contracts.spec.ts test/unit/epic3/discussionsPage.contracts.spec.ts`
- manual working-tree equivalents of `no-legacy-imports` and `no-stub-imports`
- boundary lint on task-owned files if the local toolchain supports it

**Step 1: Fix task-local regressions**

Treat pre-existing `view_thread` leaf-component errors as repo blockers unless the split introduced them directly.

**Step 2: Update docs if EPIC scope changes**

If the split reveals a real EPIC-3/EPIC-4 sequencing change, update `common_knowledge/Commonwealth-Frontend-Refactor-Plan.md` before closing the task.

---

## Outcome

- `ViewThreadPage.tsx` is now a route/data controller instead of a 1200-line page monolith.
- The main orchestration moved into `packages/commonwealth/client/scripts/views/pages/view_thread/useViewThreadData.ts`.
- The `CWContentPage` composition moved into `packages/commonwealth/client/scripts/views/pages/view_thread/ViewThreadPageShell.tsx`.
- Body, governance/mobile sub-body, sticky composer, and sidebar assembly now live in dedicated modules:
  - `ViewThreadPageBody.tsx`
  - `ViewThreadPageSubBody.tsx`
  - `ViewThreadPageComposer.tsx`
  - `viewThreadPageSidebars.tsx`
- Prediction-market thread wiring is now isolated in the sidebar assembly module instead of being embedded in the top-level page.
- `viewThreadPage.contracts.ts` now also owns pure helpers for join-banner, gated-banner, and sidebar visibility decisions.

## Verification

- Strict ESLint on task-owned EPIC-3.3 files
  - passed
- Root `pnpm lint-diff`
  - passed after a small CI follow-up in `useViewThreadData.ts`:
    - removed an unnecessary `async` wrapper from `handleGenerateAIComment` to satisfy `@typescript-eslint/require-await`
    - removed a `react-hooks/exhaustive-deps` disable comment that broke the boundaries diff lint when that rule was unavailable in the boundaries config
- Manual working-tree legacy import guard
  - passed
- Manual working-tree stub import guard
  - passed
- `pnpm -F commonwealth check-types`
  - no focused failures in the new EPIC-3.3 split files
  - remaining `view_thread` failures are pre-existing in unchanged leaf components:
    - `client/scripts/views/pages/view_thread/ThreadPollCard.tsx` (`secondary_tokens`)
    - `client/scripts/views/pages/view_thread/ThreadPredictionMarketCard.tsx` (`PredictionMarketStatus`, `results`)
    - `client/scripts/views/pages/view_thread/ThreadPredictionMarketEditorCard.tsx` (`PredictionMarketStatus`)
- `pnpm -F commonwealth bundle`
  - blocked by the same unrelated repo-wide build error as EPIC-3.1 / EPIC-3.2:
    - `libs/evm-protocols/src/event-registry/eventRegistry.ts`
    - missing `BinaryVaultAbi` export from `@commonxyz/common-protocol-abis`
- `pnpm -F commonwealth test-select test/unit/epic3/viewThreadPage.contracts.spec.ts test/unit/epic3/discussionsPage.contracts.spec.ts`
  - blocked by the shared local Vitest DB bootstrap (`Postgres.app` trust auth rejection)
- Direct boundary lint on task-owned files
  - still blocked locally because `eslint-plugin-boundaries` is not resolvable in this environment
  - the EPIC-3.3 follow-up removed the boundaries-lint-specific false positive from `useViewThreadData.ts`

## Lessons Learned

- `ViewThreadPage` can be safely decomposed if the route/render-state contract stays pure and centralized; moving `thread!`-dependent permission logic into the hook requires explicit loading-safe fallbacks.
- The desktop sidebar condition was effectively already a desktop-only contract. Extracting it into a pure helper is safer than “cleaning up” the expression inline.
- Prediction-market rendering is already split into leaf cards, so EPIC-3.3 should isolate page-level wiring rather than attempting a broader prediction-market migration inside this task.
- Repo verification in this area is still constrained by local environment issues:
  - Vitest pulls in DB bootstrap even for pure contract tests
  - boundary lint depends on a missing local ESLint plugin
