# Threading Experience Improvement Plan

This document is a practical, step-by-step plan to improve the overall thread experience across product, UX, frontend, backend, and operations.

It includes:
- Visual/UI improvements
- Behavioral improvements (ranking, notifications, moderation)
- Technical reliability/performance changes
- KPIs and rollout strategy
- AI-assisted execution prompts for each step

Use this as an implementation checklist. Complete one step at a time.

---

## 0) Scope and Success Criteria

### Goal
Make threads easier to read, easier to reply to correctly, and easier to follow over time.

### Non-goals (for first iteration)
- Redesigning the full design system
- Replacing the entire thread backend
- Introducing heavy ML ranking in v1

### Primary Success Metrics
- Increased thread depth consumption per session
- Faster time-to-first-meaningful-reply
- Reduced notification mute/unsubscribe rates
- Reduced moderator interventions per 1,000 replies
- Improved thread render p95 and branch expand p95

---

## 1) Visual Improvements (What to Change)

These are explicit visual upgrades to include in the work:

1. Thread hierarchy clarity
   - Stronger indentation rails and clearer branch boundaries
   - Better parent/child separation via spacing + subtle background tone

2. Reply target clarity
   - Distinct “Replying to @user” chip above composer
   - Root vs specific-reply toggle with clear state

3. Context breadcrumbs
   - Sticky breadcrumb bar for deep links:
     `Root > Parent > Current`
   - Quick actions: “Jump to root”, “Jump to parent”

4. New activity indicators
   - Visual badge for “New since your last visit”
   - Inline markers on branches with unseen replies

5. Collapsing and density controls
   - Consistent collapse affordances for subthreads
   - Compact mode and comfortable mode toggle

6. Quality and moderation signals
   - “Authoritative answer” visual treatment (accepted/mod marked)
   - Soft-hidden branch state that is still discoverable by choice

7. Thread navigation and scanning
   - Better empty states and loading skeletons
   - “Continue reading this branch” cues for long threads

---

## 2) Step-by-Step Implementation Plan

Follow steps in order. Each step has outcomes, tasks, and an AI prompt.

## Step 1: Baseline Audit and Instrumentation

### Outcome
You have trustworthy baseline metrics and event tracking before UI/behavior changes.

### Tasks
- Define and instrument analytics events:
  - `thread_viewed`
  - `thread_branch_expanded`
  - `thread_reply_started`
  - `thread_reply_submitted`
  - `thread_notification_muted`
  - `thread_jump_to_root`
  - `thread_jump_to_parent`
- Capture render/interaction timing:
  - initial thread load p50/p95
  - branch expand latency p50/p95
- Add dashboards for the primary success metrics.

### AI Prompt
“Find where thread analytics events are currently implemented in this repo. Add the missing events listed in `docs/threading-experience-step-by-step-plan.md` Step 1, and include any schema/types updates needed. Keep event names exactly as specified.”

---

## Step 2: Visual Hierarchy and Readability

### Outcome
Thread structure is visually legible at a glance.

### Tasks
- Update thread/comment row styles:
  - stronger nesting guides
  - cleaner spacing between sibling vs child comments
- Add visual depth caps for very deep nesting:
  - after depth N, flatten style while preserving parent metadata
- Add loading skeletons for branch expansion and initial load.

### Acceptance Criteria
- Users can distinguish parent/child/sibling without reading metadata.
- No “staircase collapse” where deep levels become unreadable.

### AI Prompt
“Locate thread/comment list rendering and styles. Implement Step 2 visual hierarchy updates from `docs/threading-experience-step-by-step-plan.md`, keeping tokens/theme usage consistent with existing component patterns.”

---

## Step 3: Reply Target Clarity (Root vs Branch)

### Outcome
Users make fewer accidental nested replies.

### Tasks
- Add explicit reply target state in composer:
  - “Reply to thread”
  - “Reply to comment”
- Show target chip with user + excerpt for branch replies.
- Add one-click “switch to root reply”.
- Ensure deep-link reply preserves intended target after refresh.

### Acceptance Criteria
- Clear target displayed before submission.
- Reply target mismatch rate decreases in analytics.

### AI Prompt
“Implement composer target state UX from Step 3 in `docs/threading-experience-step-by-step-plan.md`. Ensure target survives navigation/reload and add analytics for target switch interactions.”

---

## Step 4: Context Breadcrumbs + Jump Navigation

### Outcome
Deep-linked users are never lost in long threads.

### Tasks
- Add sticky breadcrumb for deep reply views:
  - root, parent, current
- Add jump actions:
  - jump to root
  - jump to parent
- Preserve scroll anchors when jumping and returning.

### Acceptance Criteria
- Deep-link opens with clear context.
- Jump actions work without disorienting scroll behavior.

### AI Prompt
“Add sticky thread breadcrumbs and jump actions as defined in Step 4 of `docs/threading-experience-step-by-step-plan.md`. Prioritize stable scroll anchoring and accessibility labels.”

---

## Step 5: New Activity and Visit-Aware Indicators

### Outcome
Users quickly identify what changed since last visit.

### Tasks
- Persist per-thread last-seen timestamp (or last-seen reply id).
- Mark new replies and branches since last seen.
- Add “N new replies” summary at thread top.

### Acceptance Criteria
- New markers are accurate and clear.
- Markers clear on view/read action as expected.

### AI Prompt
“Implement Step 5 visit-aware indicators from `docs/threading-experience-step-by-step-plan.md`. Add storage/query support for last-seen and show UI badges for new replies and branches.”

---

## Step 6: Collapse, Density, and Scanning Controls

### Outcome
Users can compress noisy threads and focus on relevant parts.

### Tasks
- Add per-branch collapse/expand with remembered state.
- Add global controls:
  - collapse solved/off-topic branches
  - compact vs comfortable density
- Add “continue branch” affordance for long subthreads.

### Acceptance Criteria
- Controls are discoverable and persistent.
- No content loss; collapsed state is reversible.

### AI Prompt
“Implement Step 6 branch collapse and density controls from `docs/threading-experience-step-by-step-plan.md`, including persisted user preference and keyboard-accessible controls.”

---

## Step 7: Notification Controls and Digesting

### Outcome
Notification fatigue decreases while relevance increases.

### Tasks
- Subscription granularity:
  - whole thread
  - branch only
  - direct replies/mentions only
- Add mute branch and mute thread actions.
- Bundle high-frequency events into digest windows.

### Acceptance Criteria
- Users can tune notification scope in-thread.
- Notification opt-out rates improve.

### AI Prompt
“Implement Step 7 notification scope controls and digest behavior from `docs/threading-experience-step-by-step-plan.md`. Update APIs/workers as needed and include migration-safe defaults.”

---

## Step 8: Authoritative/Helpful Reply Highlighting

### Outcome
High-signal replies surface faster.

### Tasks
- Define deterministic highlight rules for v1:
  - thread author accepted
  - moderator marked
  - trust/engagement threshold
- Add visual treatment for highlighted replies.
- Pin or surface highlighted replies near top context area.

### Acceptance Criteria
- Rules are transparent and explainable.
- Highlighting improves time-to-first-useful-answer.

### AI Prompt
“Implement deterministic highlighted-reply logic from Step 8 of `docs/threading-experience-step-by-step-plan.md` without ML. Add backend query support and frontend badges/pinning UI.”

---

## Step 9: Moderation and Thread Health Controls

### Outcome
Derailing branches are managed with less moderator effort.

### Tasks
- Add branch-level lock and slow mode.
- Add soft-hide (reversible) for low-quality subthreads.
- Add lightweight thread health telemetry:
  - branch depth
  - participant diversity
  - rapid-fire reply bursts

### Acceptance Criteria
- Moderators can act at branch granularity.
- Thread remains readable while preserving transparency.

### AI Prompt
“Implement Step 9 branch-level moderation controls in `docs/threading-experience-step-by-step-plan.md`. Include permissions, audit events, and safe UI states.”

---

## Step 10: Performance Hardening

### Outcome
Large threads feel fast and stable.

### Tasks
- Lazy-load deep branches with cursor pagination.
- Cache thread skeleton and progressively hydrate children.
- Ensure idempotent reply creation for retry safety.
- Improve ordering consistency under concurrency.

### Acceptance Criteria
- Thread load p95 and branch-expand p95 hit target budgets.
- No duplicate reply creation on retries.

### AI Prompt
“Apply Step 10 performance and reliability changes from `docs/threading-experience-step-by-step-plan.md`, focusing on branch pagination, hydration strategy, and idempotent reply creation.”

---

## Step 11: QA, Experiments, and Rollout

### Outcome
Changes are safely launched and measured.

### Tasks
- Add unit/integration tests for:
  - reply targeting
  - new markers
  - collapse state
  - notification preferences
- Add E2E scenarios for long-thread flows.
- Roll out behind feature flags:
  - internal
  - 5%
  - 25%
  - 100%
- Compare metrics against baseline.

### Acceptance Criteria
- No severe regressions in performance or moderation load.
- KPI movement is positive or neutral before full rollout.

### AI Prompt
“Create and run the test plan for Step 11 from `docs/threading-experience-step-by-step-plan.md`, then add a feature-flagged rollout checklist and KPI comparison report template.”

---

## 3) Execution Rhythm (Recommended)

Use this cadence for each step:
1. Create branch and scope PR to one step.
2. Implement with tests.
3. Run lint/typecheck/test.
4. Ship behind flag.
5. Validate metrics for 3-7 days.
6. Proceed to next step.

Do not bundle multiple high-risk steps in one PR.

---

## 4) Definition of Done (Program Level)

The threading experience improvement initiative is complete when:
- All 11 steps are implemented (or explicitly de-scoped with rationale)
- KPI dashboards show sustained improvement vs baseline
- Major thread pain points are reduced:
  - confusion about reply target
  - inability to find context
  - notification fatigue
  - poor readability in deep/large threads

---

## 5) Quick Start Prompts (Copy/Paste)

Use these prompts with your AI assistant while implementing:

- “Read `docs/threading-experience-step-by-step-plan.md`. Implement only Step 2 in this PR. Keep changes minimal and include tests.”
- “Read `docs/threading-experience-step-by-step-plan.md`. Audit current thread reply flow and implement Step 3 with analytics.”
- “Read `docs/threading-experience-step-by-step-plan.md`. Implement Step 5 backend + frontend and provide migration notes.”
- “Read `docs/threading-experience-step-by-step-plan.md`. Add tests and rollout flags for Step 7.”
- “Read `docs/threading-experience-step-by-step-plan.md`. Produce a KPI before/after report from Step 1 metrics.”

