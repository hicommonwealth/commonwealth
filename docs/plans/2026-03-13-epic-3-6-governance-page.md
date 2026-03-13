# EPIC-3.6 GovernancePage Implementation Plan

**Goal:** Normalize `GovernancePage` into a thin page entry plus a narrow governance data/init shell without broadening the task into a governance redesign.

**Architecture:** Keep `GovernancePage.tsx` as a small route surface that switches between loading, network-error, not-found, and ready states. Move chain initialization and proposal-loading orchestration into a dedicated page hook, and move the governance-specific render tree into a focused content module that still delegates cards and proposal listing to their existing modules.

**Tech Stack:** React, TypeScript, Vitest, Vite

---

### Task 1: Extract the page data/init shell

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/GovernancePage/useGovernancePageData.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/GovernancePage/GovernancePage.tsx`

**Step 1: Move chain init and proposal-loading orchestration into `useGovernancePageData.ts`**

Keep the current page contract intact:
- initialize the chain through the governance-owned `features/governance/hooks/useInitChainIfNeeded`
- preserve the `chainAdapterReady` readiness flow
- preserve Cosmos proposal loading while the chain API is still warming up
- preserve network-error vs loading behavior
- preserve current feature-flag gating behavior

**Step 2: Reduce `GovernancePage.tsx` to a thin state switch**

Keep the page entry responsible only for:
- choosing between loading, invalid-network, not-found, and content states
- composing the content module once the page is ready

### Task 2: Split governance-specific rendering

**Files:**
- Create: `packages/commonwealth/client/scripts/views/pages/GovernancePage/GovernancePageContent.tsx`

**Step 1: Move the governance render tree into `GovernancePageContent.tsx`**

Keep the content module responsible for:
- `CWPageLayout`
- `GovernanceHeader`
- `GovernanceCards`
- `ProposalListing`

Do not add new governance abstraction layers beyond this content boundary.

### Task 3: Refresh focused coverage

**Files:**
- Modify: `packages/commonwealth/test/component/pages/governancePage.integration.spec.tsx`

**Step 1: Extend the existing behavior guard**

Add a focused check that `GovernancePage` still shows the loading state while Cosmos proposal queries are in-flight, in addition to the existing loading, invalid-network, content, and feature-disabled cases.

### Task 4: Verify and document

**Run:**
- `pnpm exec eslint --max-warnings=0 packages/commonwealth/client/scripts/views/pages/GovernancePage/GovernancePage.tsx packages/commonwealth/client/scripts/views/pages/GovernancePage/GovernancePageContent.tsx packages/commonwealth/client/scripts/views/pages/GovernancePage/useGovernancePageData.ts`
- `pnpm -F commonwealth test-component -- test/component/pages/governancePage.integration.spec.tsx`
- `pnpm lint-diff`
- `pnpm -F commonwealth check-types`
- `pnpm -F commonwealth bundle`
- `pnpm -F commonwealth no-legacy-imports`
- `pnpm -F commonwealth no-stub-imports`
- `pnpm -F commonwealth lint-boundaries`

**Step 1: Fix only task-local regressions**

Treat broader repo failures as blockers only when they changed because of the Governance page normalization.

**Step 2: Update EPIC docs only if sequencing changes**

If this task reveals a real EPIC-3 or EPIC-4 sequencing change, update `common_knowledge/Commonwealth-Frontend-Refactor-Plan.md` before closing the task.

---

## Outcome

- `GovernancePage.tsx` is now a thin page surface instead of owning chain initialization, proposal query wiring, loading-state branching, and the governance render tree inline.
- Chain initialization and governance page readiness state now live in `packages/commonwealth/client/scripts/views/pages/GovernancePage/useGovernancePageData.ts`.
- The page now consumes the governance-owned `features/governance/hooks/useInitChainIfNeeded` path directly instead of the legacy compatibility hook path.
- Governance-specific rendering now lives in `packages/commonwealth/client/scripts/views/pages/GovernancePage/GovernancePageContent.tsx`.
- Existing header, cards, and proposal listing ownership remains unchanged; the task stayed narrow and did not introduce additional speculative governance abstractions.
- `packages/commonwealth/test/component/pages/governancePage.integration.spec.tsx` now also guards the Cosmos proposal-loading state.

## Verification

- Strict ESLint on task-owned EPIC-3.6 files
  - passed
- `pnpm -F commonwealth test-component -- test/component/pages/governancePage.integration.spec.tsx`
  - blocked by the current component-test environment before tests execute
  - Vitest cannot resolve `@testing-library/jest-dom/vitest` from `packages/commonwealth/test/component/setup.ts`
- `pnpm lint-diff`
  - passed with the same ignored-test warnings already present on this branch
- `pnpm -F commonwealth check-types`
  - still fails repo-wide on existing blockers
  - no task-local failures remain in:
    - `GovernancePage.tsx`
    - `GovernancePageContent.tsx`
    - `useGovernancePageData.ts`
- `pnpm -F commonwealth bundle`
  - still fails on the existing repo-wide `BinaryVaultAbi` export error in `libs/evm-protocols/src/event-registry/eventRegistry.ts`
- `pnpm -F commonwealth no-legacy-imports`
  - passed
- `pnpm -F commonwealth no-stub-imports`
  - passed
- `pnpm -F commonwealth lint-boundaries`
  - still blocked locally because `eslint-plugin-boundaries` is not resolvable in this environment

## Lessons Learned

- `GovernancePage` only needed a page-state hook and a single content boundary; anything more would have been abstraction noise for EPIC-3.6.
- `chainAdapterReady` cleanup should use the same callback reference that was registered. The previous inline cleanup shape was fragile and harder to reason about during refactor work.
- The component-test environment is still globally broken, so route-page smoke specs remain useful for intent and documentation but not currently executable as regression signal.
