# EPIC-3.1 UseCommunityContests Implementation Plan

**Goal:** Move `useCommunityContests` and its contest-specific helper/type dependencies into `features/contests/*` without changing behavior.

**Architecture:** Keep the public hook contract stable while changing ownership. The new source of truth lives under `features/contests/{hooks,utils,types}` and the legacy `views/pages/CommunityManagement/Contests/useCommunityContests.ts` path becomes a compatibility shim. Remove the hook's dependency on `views/components/CommunityStake/*` by inlining the narrow `stakeEnabled` fetch it actually needs.

**Tech Stack:** React, TypeScript, Vitest, Vite, tRPC React Query hooks

---

### Task 1: Create contest feature types and helpers

**Files:**
- Create: `packages/commonwealth/client/scripts/features/contests/types/contest.ts`
- Create: `packages/commonwealth/client/scripts/features/contests/utils/contestUtils.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/CommunityManagement/Contests/utils.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/CommunityManagement/Contests/ContestsList/ContestsList.tsx`

**Step 1: Move the page-local `Contest` shape into `features/contests/types/contest.ts`**

Keep the current type shape intact so callers do not have to change behavior.

**Step 2: Move `isContestActive` and contest list partition/sort helpers into `features/contests/utils/contestUtils.ts`**

Keep the existing active-vs-finished semantics:
- active contests sort by earliest end time, then highest prize
- finished contests sort by latest end time first
- suggested/global contests keep only active contests

**Step 3: Leave compatibility exports in legacy views paths**

`ContestsList.tsx` and legacy `utils.ts` should import from the new feature files and re-export the old symbols only where needed.

### Task 2: Move the hook to `features/contests/hooks`

**Files:**
- Create: `packages/commonwealth/client/scripts/features/contests/hooks/useCommunityContests.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/CommunityManagement/Contests/useCommunityContests.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/CommunityManagement/Contests/ContestsList/index.ts`

**Step 1: Copy the current hook into the new feature path**

Keep the external API the same:
- `stakeEnabled`
- `isContestAvailable`
- `contestsData.{all,finished,active,suggested}`
- `isContestDataLoading`
- `getContestByAddress`
- `isSuggestedMode`

**Step 2: Remove the dependency on `views/components/CommunityStake/useCommunityStake.ts`**

Inside the new hook, replace that import with the minimal query logic needed to derive `stakeEnabled` directly from `state/api/communityStake` and `STAKE_ID`.

**Step 3: Turn the legacy hook file into a compatibility shim**

Re-export the new feature-owned hook from the old path so current consumers keep working while the repo migrates incrementally.

### Task 3: Reduce page-local type ownership

**Files:**
- Modify: `packages/commonwealth/client/scripts/views/components/sidebar/helpers.ts`
- Modify: `packages/commonwealth/client/scripts/views/components/NewThreadForm/helpers/helpers.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/RenderThreadCard.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/HeaderWithFilters/HeaderWithFilters.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/ContestPage/tabs/Judges/JudgesTab.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/ContestPage/utils.ts`

**Step 1: Update type-only imports that still point at `views/pages/CommunityManagement/Contests/ContestsList`**

Point them at `features/contests/types/contest` unless a legacy import must remain for compatibility.

**Step 2: Keep runtime imports stable**

Do not widen the change set to broader contest page migration work in EPIC-4.

### Task 4: Add focused regression coverage

**Files:**
- Create: `packages/commonwealth/test/unit/features/contests/contestUtils.spec.ts`

**Step 1: Add unit coverage for the extracted contest helpers**

Cover:
- `isContestActive`
- active/finished partitioning
- active sort ordering
- finished sort ordering

**Step 2: Keep tests pure**

Prefer testing the extracted pure helpers over building a large hook test harness for this issue.

### Task 5: Verify and document

**Run:**
- `pnpm -F commonwealth check-types`
- `pnpm -F commonwealth bundle`
- `pnpm -F commonwealth test-select test/unit/features/contests/contestUtils.spec.ts`
- `pnpm -F commonwealth lint-boundaries`
- `pnpm -F commonwealth no-legacy-imports`
- `pnpm -F commonwealth no-stub-imports`

**Step 1: Fix failures before moving on**

Read each log, patch the actual cause, then rerun only the affected command.

**Step 2: Update docs if scope changed**

If the implementation reveals that EPIC-3.1 touches more or less surface than the current plan says, update `common_knowledge/Commonwealth-Frontend-Refactor-Plan.md` before closing the task.

---

## Outcome

- `useCommunityContests` now lives at `packages/commonwealth/client/scripts/features/contests/hooks/useCommunityContests.ts`.
- Contest-specific shared ownership moved into:
  - `packages/commonwealth/client/scripts/features/contests/types/contest.ts`
  - `packages/commonwealth/client/scripts/features/contests/utils/contestUtils.ts`
- The legacy hook path under `views/pages/CommunityManagement/Contests/useCommunityContests.ts` is now a compatibility re-export.
- The new feature hook no longer imports `views/components/CommunityStake/*`; it derives `stakeEnabled` directly from `state/api/communityStake`.
- Cross-surface consumers were repointed to the feature-owned hook path so the old `views` path is no longer the primary import surface.

## Verification

- `pnpm -F commonwealth lint-boundaries`
  - repo script returned no-op on an uncommitted branch because it only checks `origin/master...HEAD`
- `pnpm -F commonwealth no-legacy-imports`
  - repo script returned no-op for the same reason
- `pnpm -F commonwealth no-stub-imports`
  - repo script returned no-op for the same reason
- Manual working-tree equivalent for legacy/stub import guards
  - passed after switching the feature hook to alias-import `features/contests/utils/contestUtils`
- Strict ESLint on task-owned EPIC-3.1 files
  - passed
- `pnpm -F commonwealth test-select test/unit/features/contests/contestUtils.spec.ts`
  - blocked by local DB bootstrap in shared Vitest setup (`Postgres.app` trust auth rejection)
- `pnpm -F commonwealth bundle`
  - blocked by unrelated repo-wide build error in `libs/evm-protocols/src/event-registry/eventRegistry.ts` importing missing `BinaryVaultAbi`
- `pnpm -F commonwealth check-types`
  - task-local contest/type issues resolved
  - remaining focused failures are unrelated pre-existing errors in:
    - `views/pages/ContestPage/tabs/Judges/JudgesTab.tsx` (`MIN_SEARCH_LENGTH` export)
    - `views/pages/discussions/DiscussionsPage.tsx` (`secondary_tokens`)
    - `views/pages/discussions/HeaderWithFilters/HeaderWithFilters.tsx` (`secondary_tokens`)

## Lessons Learned

- The repo diff guard scripts are commit-range based; before commit they do not validate the working tree. For in-progress refactors, run an equivalent working-tree scan manually.
- The `no-legacy-imports` regex also flags relative imports like `../utils/...`, so feature-owned modules should prefer stable alias imports when the path segment matches guarded legacy names.
- A dedicated shared `Contest` UI contract is still necessary even after moving ownership to `features/contests`, because current page/components are looser than the raw backend projection types.
