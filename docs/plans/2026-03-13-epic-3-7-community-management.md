# EPIC-3.7: Split CommunityManagement sub-pages

## Summary

- extracted Community stake ownership seams into feature-owned modules:
  - `client/scripts/features/communityStake/hooks/useCommunityStake.ts`
  - `client/scripts/features/communityStake/utils/stakeChains.ts`
- kept rollout-safe compatibility exports in:
  - `client/scripts/views/components/CommunityStake/useCommunityStake.ts`
  - `client/scripts/views/components/CommunityStake/index.ts`
  - `client/scripts/views/components/CommunityInformationForm/constants.ts`
- removed task-scope CommunityManagement pages from direct dependency on `views/components/CommunityStake` and page-local stake chain constants:
  - `CommunityManagement/Integrations/Stake/Stake.tsx`
  - `CommunityManagement/StakeIntegration/StakeIntegration.tsx`
  - `CommunityManagement/Contests/ManageContest/steps/SignTransactionsStep/SignTransactionsStep.tsx`
  - `CommunityManagement/Topics/WVMethodSelection/WVMethodSelection.tsx`
- extracted topic-flow contracts out of the large `Topics.tsx` page into `Topics/topicFlow.ts`, then repointed weighted-voting step pages and `StakeIntegration` to the new shared module
- split `AdminContestsPage` into controller/content modules:
  - `useAdminContestsPageData.ts`
  - `AdminContestsPageContent.tsx`
  - `AdminContestsPageList.tsx`
  - `AdminContestsPageTypeSelection.tsx`
  - `adminContestsPage.contracts.ts`
- split `StakeIntegration` into controller/content modules:
  - `useStakeIntegrationData.ts`
  - `StakeIntegrationContent.tsx`
- added pure contract coverage in `test/unit/epic3/adminContestsPage.contracts.spec.ts`

## Verification

- `pnpm exec eslint` on task-owned EPIC-3.7 files: pass
- `pnpm exec eslint --no-ignore packages/commonwealth/test/unit/epic3/adminContestsPage.contracts.spec.ts`: pass
- `pnpm lint-diff`: pass with existing ignored-test warnings only
- `pnpm -F commonwealth test-select test/unit/epic3/adminContestsPage.contracts.spec.ts`: blocked by local Postgres.app trust-auth bootstrap
- `pnpm -F commonwealth check-types`: still fails repo-wide, but the EPIC-3.7 follow-up errors introduced during the refactor were cleared
- `pnpm -F commonwealth bundle`: still fails on the existing `BinaryVaultAbi` export blocker in `libs/evm-protocols/src/event-registry/eventRegistry.ts`
- `pnpm -F commonwealth test-component -- --allowOnly=false`: still blocked in this environment because `@testing-library/jest-dom/vitest` cannot be resolved from `packages/commonwealth/test/component/setup.ts`
- `pnpm -F commonwealth lint-boundaries`: still blocked locally because `eslint-plugin-boundaries` is not resolvable

## Notes

- `Integrations.tsx` itself was already a thin composition page; the meaningful EPIC-3.7 seam was the ownership of stake-related hooks/constants underneath it, not another superficial wrapper split
- `StakeIntegration` was tightly coupled to `Topics.tsx` through topic-flow types; moving those contracts into `Topics/topicFlow.ts` reduces one of the main first-wave sub-page couplings called out by this epic
- `chainIdsWithStakeEnabled` needed a compatibility re-export from `CommunityInformationForm/constants.ts` because `CreateCommunity/useCreateCommunity.ts` still depends on the old path outside the EPIC-3.7 slice

## Lessons learned

- diff-only guard scripts miss uncommitted files, so task-local ESLint plus targeted grep checks are still necessary before commit
- for CommunityManagement, the highest-value refactor seams are shared contracts and feature ownership boundaries, not mechanically splitting every already-small route file
