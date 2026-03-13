# EPIC-3.8: Normalize Home discovery surfaces

## Outcome

- extracted the shared home discovery stack into `packages/commonwealth/client/scripts/views/pages/HomePage/HomeDiscoverySections.tsx`
- extracted duplicated stake modal wiring into `packages/commonwealth/client/scripts/views/pages/HomePage/HomePageManageCommunityStakeModal.tsx`
- reduced `packages/commonwealth/client/scripts/views/pages/HomePage/HomePage.tsx` to a thinner page shell that now delegates shared discovery ownership instead of composing the contest / prediction market / quest / thread surfaces inline
- split `packages/commonwealth/client/scripts/views/pages/CommunityHome/CommunityHomePage.tsx` into:
  - `packages/commonwealth/client/scripts/views/pages/CommunityHome/useCommunityHomePageData.ts`
  - `packages/commonwealth/client/scripts/views/pages/CommunityHome/CommunityHomePageContent.tsx`
- kept community-specific sections local to Community Home:
  - `TokenDetails`
  - `TokenPerformance`
  - `CommunityTransactions`
  - sticky thread composer / thread creation flow
- kept prediction-market discovery explicitly in scope by routing both `HomePage` and `CommunityHomePage` through the shared discovery stack
- extended component coverage in:
  - `packages/commonwealth/test/component/pages/homePage.integration.spec.tsx`
  - `packages/commonwealth/test/component/pages/communityHomePage.integration.spec.tsx`

## Verification

- `pnpm exec eslint packages/commonwealth/client/scripts/views/pages/HomePage/HomePage.tsx packages/commonwealth/client/scripts/views/pages/HomePage/HomeDiscoverySections.tsx packages/commonwealth/client/scripts/views/pages/HomePage/HomePageManageCommunityStakeModal.tsx packages/commonwealth/client/scripts/views/pages/CommunityHome/CommunityHomePage.tsx packages/commonwealth/client/scripts/views/pages/CommunityHome/CommunityHomePageContent.tsx packages/commonwealth/client/scripts/views/pages/CommunityHome/useCommunityHomePageData.ts`
  - passed
- `pnpm exec eslint --no-ignore packages/commonwealth/test/component/pages/homePage.integration.spec.tsx packages/commonwealth/test/component/pages/communityHomePage.integration.spec.tsx`
  - no errors
  - existing `react/no-multi-comp` warnings remain in the mock-heavy integration specs
- `pnpm lint-diff`
  - passed with the same ignored-test warnings already present on this branch
- `pnpm -F commonwealth no-legacy-imports`
  - passed
- `pnpm -F commonwealth no-stub-imports`
  - passed
- `pnpm -F commonwealth test-component -- --allowOnly=false`
  - still blocked before test execution in this environment
  - Vitest cannot resolve `@testing-library/jest-dom/vitest` from `packages/commonwealth/test/component/setup.ts`
- `pnpm -F commonwealth check-types`
  - still fails repo-wide on existing blockers
  - task-local `useCommunityHomePageData.ts` typing fallout was fixed during this task
  - no remaining EPIC-3.8-specific type errors were observed after that fix
- `pnpm -F commonwealth bundle`
  - still fails on the existing repo-wide `BinaryVaultAbi` export error in `libs/evm-protocols/src/event-registry/eventRegistry.ts`
- `pnpm -F commonwealth lint-boundaries`
  - still blocked locally because `eslint-plugin-boundaries` is not resolvable in this environment

## Notes

- the GitHub issue for `#13461` references a stale `CommunityHomePage` path; the live codebase uses `views/pages/CommunityHome/CommunityHomePage.tsx`
- `HomePage.tsx` was already small in raw LOC, but its ownership boundary was still blurry because the shared discovery surfaces and stake modal orchestration were embedded directly in the page
- `CommunityHomePage.tsx` was the real EPIC-3.8 bottleneck because it mixed shared discovery sections, community-specific summary sections, sticky composer state, and thread-creation orchestration in one file

## Lessons Learned

- for EPIC-3.8, the high-value seam was the repeated discovery stack and duplicated modal orchestration, not a cosmetic split of already-small child sections
- `CommunityHomePage` benefits from the same controller/content split pattern used earlier in EPIC-3, but only after extracting the shared discovery surfaces that both home pages actually depend on
- diff-only guard scripts still miss uncommitted files, so task-owned ESLint and direct file inspection remain necessary before commit
