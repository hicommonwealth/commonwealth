---
name: AI-Assisted Task
about: Task structured for AI workflow
labels: ai-ready, type:feature
---

## Description
[Provide a clear, user-facing description of what needs to be built or fixed]

## Technical Context
**Type:** feature | fix | refactor | chore | docs | test (determines branch prefix)
**Category:** ui | api | database | workers | shared | testing | infra
**Priority:** critical | high | medium | low
**Risk:** low | medium | high
**Packages:** @hicommonwealth/commonwealth, @hicommonwealth/model, etc.

### Architecture Notes
- [List adapter patterns to follow, e.g., "Use cache adapter, not direct Redis"]
- [Note related systems affected, e.g., "Impacts event worker flow"]
- [Highlight constraints or invariants, e.g., "Must maintain backward compatibility"]

## Implementation Steps
- [ ] Step 1: Specific technical task with file/location hints
- [ ] Step 2: Specific technical task with file/location hints
- [ ] Step 3: Specific technical task with file/location hints

## Testing Requirements
- **Unit tests:** [What behaviors to test, which files]
- **Integration tests:** [What integration points to verify]
- **Manual verification:** [What to check in browser/logs]

## Dependencies
**Blocked by:** #[issue-number] (optional)
**Blocks:** #[issue-number] (optional)

## Acceptance Criteria
- [ ] Types check passes (pnpm -r check-types)
- [ ] Linting passes (pnpm lint-branch-warnings)
- [ ] Unit tests pass and new tests added
- [ ] [Any other specific criteria]

---
**Labels to add:**
- **Required:** `ai-ready` (marks issue ready for AI)
- **Type:** `type:feature` | `type:fix` | `type:refactor` | `type:chore` | `type:docs` | `type:test`
  - Determines branch name: `feature/1234-title`, `fix/1234-title`, etc.
- **Priority:** `priority:critical` | `priority:high` | `priority:medium` | `priority:low`
- **Risk:** `risk:low` | `risk:medium` | `risk:high`
- **Area:** `area:ui` | `area:api` | `area:database` | `area:workers`

**Example:** `ai-ready`, `type:feature`, `priority:high`, `risk:low`, `area:ui`

**Branch naming:** Issue #1234 with title "Add user authentication" and label `type:feature` → branch `ro/feature-1234-add-user-authentication` (where `ro` comes from your git config initials)
