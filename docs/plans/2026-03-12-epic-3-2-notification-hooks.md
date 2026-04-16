# EPIC-3.2 Notification Hooks Implementation Plan

**Goal:** Move shared notification subscription and preference hooks out of `views/pages/NotificationSettings/` into `features/notifications/hooks/` while keeping Notification Settings and discussions behavior unchanged.

**Architecture:** Keep the reusable notification-domain hooks under `features/notifications/hooks/` and repoint both Notification Settings and discussion subscribe toggles to those feature-owned paths. Leave the old Notification Settings hook files as compatibility re-exports so the rollout stays incremental without changing the route/page structure.

**Tech Stack:** React, TypeScript, tRPC React Query hooks, Vite

---

### Task 1: Create feature-owned notification hooks

**Files:**
- Create: `packages/commonwealth/client/scripts/features/notifications/hooks/useThreadSubscriptions.ts`
- Create: `packages/commonwealth/client/scripts/features/notifications/hooks/useCommentSubscriptions.ts`
- Create: `packages/commonwealth/client/scripts/features/notifications/hooks/useTopicSubscriptions.ts`
- Create: `packages/commonwealth/client/scripts/features/notifications/hooks/useSubscriptionPreferenceSetting.ts`
- Create: `packages/commonwealth/client/scripts/features/notifications/hooks/useSubscriptionPreferenceSettingToggle.ts`
- Create: `packages/commonwealth/client/scripts/features/notifications/hooks/useSupportsPushNotifications.ts`

**Step 1: Copy the existing Notification Settings hook implementations into `features/notifications/hooks/`**

Preserve the current runtime contracts, including the zod parsing workarounds in the subscription query hooks.

**Step 2: Remove page-path dependencies inside the moved hooks**

In particular, `useSubscriptionPreferenceSettingToggle.ts` must import `SubscriptionPrefType` from the new feature-owned path instead of the old Notification Settings page path.

### Task 2: Repoint consumers to the feature-owned hooks

**Files:**
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/index.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/PushNotificationsToggle.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/PushNotificationsToggleMaster.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/ThreadSubscriptions.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/CommentSubscriptions.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/TopicSubscriptions.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/CommentCard/ToggleCommentSubscribe.tsx`
- Modify: `packages/commonwealth/client/scripts/views/pages/discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe.tsx`

**Step 1: Repoint Notification Settings page/components to `features/notifications/hooks/*`**

Keep all page-local rendering in place. Only the hook imports should move.

**Step 2: Repoint discussion subscribe toggles to `features/notifications/hooks/*`**

This removes the current cross-feature dependency on `views/pages/NotificationSettings/*`.

### Task 3: Leave compatibility shims at the old page paths

**Files:**
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/useThreadSubscriptions.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/useCommentSubscriptions.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/useTopicSubscriptions.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/useSubscriptionPreferenceSetting.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/useSubscriptionPreferenceSettingToggle.ts`
- Modify: `packages/commonwealth/client/scripts/views/pages/NotificationSettings/useSupportsPushNotifications.ts`

**Step 1: Convert legacy page-local hook files into re-exports**

Keep them thin and ownership-free so future EPIC-4 cleanup can remove them safely once the repo no longer depends on them.

### Task 4: Verify and document

**Run:**
- `pnpm -F commonwealth check-types`
- `pnpm -F commonwealth bundle`
- `pnpm -F commonwealth lint-boundaries`
- `pnpm -F commonwealth no-legacy-imports`
- `pnpm -F commonwealth no-stub-imports`
- `pnpm exec eslint --max-warnings=0 <task-owned files>`

**Step 1: Fix task-local failures**

Only patch failures caused by the hook move. If the repo still has unrelated global blockers, document them explicitly with file references.

**Step 2: Update task notes with verification and lessons learned**

If EPIC-3.2 reveals a new scope or sequencing risk for EPIC-3/EPIC-4, reflect it in the task note and, if needed, in `common_knowledge/Commonwealth-Frontend-Refactor-Plan.md`.

---

## Outcome

- Shared notification hooks now live under `packages/commonwealth/client/scripts/features/notifications/hooks/`.
- `NotificationSettings` page/components and the discussions subscribe toggles now import notification-domain hooks from the feature-owned path instead of `views/pages/NotificationSettings/use*`.
- The legacy `views/pages/NotificationSettings/use*.ts` files were converted into compatibility re-exports, so the page folder no longer owns the reusable logic.
- `useSubscriptionPreferenceSettingToggle` no longer depends on a page-local type import; `SubscriptionPrefType` is owned by the feature hook layer.

## Verification

- Manual working-tree equivalent of `no-legacy-imports` / `no-stub-imports`
  - passed
- Focused cross-import check on `features/notifications`
  - passed; no imports back into `views/pages/NotificationSettings`
- Strict ESLint on task-owned notification/discussion files
  - passed
- `pnpm -F commonwealth check-types`
  - no focused failures in:
    - `features/notifications/*`
    - `views/pages/NotificationSettings/*`
    - `views/pages/discussions/CommentCard/ToggleCommentSubscribe.tsx`
    - `views/pages/discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe.tsx`
  - repo still exits non-zero because of unrelated global type errors outside this task
- `pnpm -F commonwealth bundle`
  - blocked by the same unrelated repo-wide build error as EPIC-3.1:
    - `libs/evm-protocols/src/event-registry/eventRegistry.ts`
    - missing `BinaryVaultAbi` export from `@commonxyz/common-protocol-abis`
- Targeted tests
  - no existing focused Notification Settings / discussion subscription specs were found to run for this move

## Lessons Learned

- Notification-domain hooks in this area were already page-agnostic; the main risk was import ownership, not behavior. Repointing all real consumers mattered more than changing hook internals.
- The repo import guards still need working-tree equivalents before commit, because the built-in scripts only inspect `origin/master...HEAD`.
- Compatibility re-exports are sufficient here to keep rollout safety without blocking the page from moving toward presentation-only ownership in later EPIC-4 cleanup.
