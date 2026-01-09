# AI Workflow for Commonwealth Development

## Quick Reference

> **New developer?** See [`.ai/quickstart.md`](quickstart.md) for detailed setup instructions.

## Purpose

This directory defines a **shared AI-assisted workflow** for evolving the Commonwealth codebase. The goal is to empower a small team to work effectively on an existing, non-AI-first codebase by:

1. **Constraining AI scope** – Give the AI a predictable lane for proposing and validating changes
2. **Maintaining code quality** – Ensure type safety, test coverage, and architectural consistency
3. **Building shared memory** – Leave traces of reasoning and decisions for future contributors
4. **Reducing coordination overhead** – Minimize conflicts and spec drift through disciplined iterations

This workflow is designed for **incremental adoption** – it works alongside traditional development and scales as the team builds confidence.

---

## The Fundamental Challenge

Commonwealth is a complex TypeScript monorepo (71+ models, 8+ microservices, multi-chain support) built before AI-assisted development was common. Introducing AI assistance faces these realities:

- **Implicit architecture** – Patterns like the adapter registry, event-driven workers, and Sequelize models have conventions not documented in code
- **Distributed state** – Frontend (React Query + Zustand), backend (PostgreSQL + Redis), and workers (RabbitMQ) must stay synchronized
- **Type safety boundaries** – Schemas, validators, and TypeScript types must align across packages
- **Testing gaps** – Legacy code may lack comprehensive test coverage, making validation harder
- **Team knowledge** – Domain expertise exists in developer heads, not always in documentation

**The AI can accelerate development, but only if we constrain its blast radius and enforce validation.**

---

## Core Workflow: The 5-Step Cycle

Every AI-assisted task follows this sequence:

### 1. **Pick One Feature**
   - Read GitHub issue details
   - When using `--auto`, AI selects highest-priority task based on:
     - Priority labels (critical > high > medium > low)
     - Risk assessment
     - Context (related tasks in same domain area)
   - **Rule: Only one feature per run** – prevents conflicts and scope creep

### 2. **Implement with Constraints**
   - Follow Commonwealth patterns (see CLAUDE.md)
   - Use existing abstractions before creating new ones
   - Respect package boundaries (@hicommonwealth/model, @hicommonwealth/core, etc.)
   - Match coding style (functional components, destructured props, Zustand conventions)
   - **Critical: Read existing code first** – Never propose changes to unread files

### 3. **Validate Output**
   ```bash
   # Type checking (must pass)
   pnpm -r check-types

   # Linting (must pass)
   pnpm lint-branch-warnings

   # Unit tests (must pass for changed modules)
   pnpm -F commonwealth test-unit
   pnpm -F model test-select {test-name}

   # Integration tests (when touching API/database)
   pnpm -F commonwealth test-integration
   ```
   - **No green checkmarks = incomplete work** – Fix issues before proceeding
   - **Add tests for new functionality** – Unit tests are required (see [Unit Test Requirements](#unit-test-requirements-for-new-functionality))
   - **Generate UI screenshots for significant UI changes** – Use Playwright MCP (see [UI Screenshot Requirements](#ui-screenshot-requirements))

### 4. **Update Documentation**
   - Update GitHub issue with completion comment
   - Change label from `ai-in-progress` to `ai-completed`
   - Append to `progress.txt` with:
     - What was completed
     - Key decisions made
     - Concerns for next contributor
     - Related tasks that emerged
   - Update inline comments/JSDoc for complex logic
   - **Do not** create separate documentation files unless explicitly required

### 5. **Commit Atomically**
   - One commit per completed feature
   - Commit message format:
     ```
     <type>: <description>

     - Completed PRD task: <task description>
     - Changes: <file areas touched>
     - Tests: <test coverage added/updated>

     🤖 Generated with Claude Code
     Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
     ```
   - Types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`
   - **Never commit failing types or tests**

### 6. **Create Pull Request**
   - Push branch: `git push -u origin <branch-name>`
   - Create PR with `gh pr create`
   - **IMPORTANT:** PR body MUST include `Closes #<issue-number>` to auto-close the issue when merged
   - PR format:
     ```markdown
     ## Summary
     - Brief description of what was implemented
     - Key changes made

     ## Test Plan
     - [ ] Unit tests pass (`pnpm -F commonwealth test-unit`)
     - [ ] Type checks pass (`pnpm -r check-types`)
     - [ ] Manual verification: <steps to verify>

     ## Screenshots (if UI changes)
     ![Description](screenshot-path.png)

     Closes #<issue-number>

     🤖 Generated with [Claude Code](https://claude.ai/code)
     ```
   - The `Closes #` keyword triggers GitHub's auto-close feature when PR is merged

---

## Why This Workflow Works

The value of AI-assisted development appears only when:

> **The distance between generated result and expected result is small and visible.**

This workflow keeps that distance small by:

- **Linear execution** – One task at a time, no parallel confusion
- **Domain language** – Tasks expressed as features, not implementation details
- **Minimal testing contract** – Type checks + unit tests as proof of correctness
- **Shared memory** – Progress file prevents repeated mistakes
- **Human-in-the-loop validation** – Types/tests/lints are automated reviewers

Complex orchestration (parallel edits, autonomous branching, opaque lifecycle tests) widens the gap and forces humans to become **debuggers of the AI** instead of **owners of the domain**.

---

## Refactoring Legacy Code with AI

Commonwealth wasn't built AI-first, so expect these patterns:

### Common Refactoring Needs
1. **Missing type safety** – `any` types, implicit returns, untyped event handlers
2. **React anti-patterns** – Missing dependencies in useEffect, inline function props, prop drilling
3. **Test gaps** – Critical paths without coverage, manual testing assumptions
4. **Inconsistent patterns** – Mix of class/functional components, varied state management
5. **Monolithic files** – 500+ line components, mixed concerns

### AI-Assisted Refactoring Strategy
```
Phase 1: Type Safety (Low Risk)
- Add TypeScript types to untyped code
- Replace 'any' with proper types
- Add Zod schemas for runtime validation

Phase 2: Test Coverage (Medium Risk)
- Add unit tests for business logic
- Cover happy paths first, edge cases second
- Focus on pure functions and hooks

Phase 3: Structural (Higher Risk)
- Extract components from monoliths
- Migrate class to functional components
- Consolidate state management patterns
```

**Rule: Never refactor and add features in the same task.** Separate concerns to isolate breakage.

---

## Task Management: GitHub Issues as Single Source of Truth

GitHub Issues are the **only** source of tasks for the AI workflow. This approach:

- ✓ Eliminates sync overhead between tools
- ✓ Keeps team in single workflow they already use
- ✓ Provides real-time progress visibility
- ✓ Enables automatic PR/issue linking
- ✓ Uses familiar priority, labels, milestones

**Creating Issues:**

**Option 1: AI-Generated (Recommended)**
```bash
# Let AI create a detailed, compliant issue from your description
./ai/create-ticket.sh "Add user authentication feature"
./ai/create-ticket.sh "Fix button alignment on mobile"
./ai/create-ticket.sh "Refactor state management to use Zustand"
```

The AI will:
- Analyze your description
- Infer correct type, priority, risk, category
- Generate implementation steps following Commonwealth patterns
- Create testing requirements
- Add appropriate labels
- Create the GitHub issue

**Option 2: Manual Creation**
```bash
# Use the GitHub issue template manually
gh issue create --template ai-task.md
```

**Running the Workflow:**
```bash
# Work on specific issue
./ai/run.sh 1234

# Auto-select highest priority
./ai/run.sh --auto
```

**GitHub Issue Template for AI Tasks:**
```markdown
## Description
[User-facing feature description]

## Technical Context
**Category:** ui | api | database | workers | shared | testing | infra
**Priority:** critical | high | medium | low
**Risk:** low | medium | high
**Packages:** @hicommonwealth/commonwealth, @hicommonwealth/model

### Architecture Notes
- [Adapter patterns to follow]
- [Related systems affected]
- [Constraints or invariants]

## Implementation Steps
- [ ] Step 1: Specific technical task
- [ ] Step 2: Specific technical task
- [ ] Step 3: Specific technical task

## Testing Requirements
- Unit tests: [What to test]
- Integration tests: [What to test]
- Manual verification: [What to check]

## Dependencies
Blocked by: #1233
Blocks: #1236

## Labels
`ai-ready`, `type:feature`, `priority:high`, `risk:low`, `area:ui`
```

**AI Workflow:**
1. Read issue via GitHub API (using `gh` CLI)
2. Parse technical context and steps
3. Implement following the workflow
4. Update issue with comment:
   ```
   ✅ Completed by AI
   - Commit: abc123f
   - Tests passing: ✓
   - See .ai/progress.txt for details
   ```
5. Move issue to "Review" column
6. Apply label: `ai-completed`

### Workflow Details

**Setup:**

1. **GitHub Issue Labels** (create these once using `setup-labels.sh`)
   ```
   # Workflow status
   ai-ready       # Issue has enough detail for AI
   ai-in-progress # AI is currently working on this
   ai-completed   # AI finished, needs human review
   ai-blocked     # AI couldn't complete, needs human help

   # Priority
   priority:critical
   priority:high
   priority:medium
   priority:low

   # Risk level
   risk:low       # Safe for AI (UI changes, tests)
   risk:medium    # Moderate risk (API changes)
   risk:high      # High risk (migrations, auth)

   # Type (determines branch prefix)
   type:feature   # Creates feature/* branch (default)
   type:fix       # Creates fix/* branch
   type:refactor  # Creates refactor/* branch
   type:chore     # Creates chore/* branch
   type:docs      # Creates docs/* branch
   type:test      # Creates test/* branch

   # Area
   area:ui
   area:api
   area:database
   area:workers
   ```

2. **Issue Template** - Already created at `.github/ISSUE_TEMPLATE/ai-task.md`

3. **Run Script** - The `run.sh` script handles:
   - Fetching issue details via GitHub API
   - Passing context to Claude
   - Managing label transitions (`ai-ready` → `ai-in-progress` → `ai-completed`)
   - Posting completion comments to issues
   - Error handling and status updates

   See `.ai/run.sh` for full implementation.

**Auto-Selection Mode**

For even less manual work, let the AI select the highest-priority task:

```bash
./ai/run.sh --auto
```

The script automatically finds and works on the highest-priority `ai-ready` issue:
- Tries `priority:critical` first
- Falls back to `priority:high`
- Falls back to any `ai-ready` issue

---

## Testing Contract: Tiered Approach

Commonwealth's size requires pragmatic test coverage:

### Must-Have (Blocking)
```bash
✓ Type checking passes (pnpm -r check-types)
✓ Linting passes (pnpm lint-branch-warnings)
✓ Unit tests for new business logic
✓ Existing tests still pass
```

### Should-Have (Task-Dependent)
- **API changes** → Integration tests via supertest
- **Database models** → Model unit tests with test DB
- **React components** → Component tests with React Testing Library
- **Hooks** → Hook tests with @testing-library/react-hooks
- **Workers** → Service tests with mocked adapters

### Later (Not Blocking)
- E2E tests (Playwright) – Run in CI, not per-task
- Load tests – Quarterly performance validation
- Visual regression – Design system changes only

### Test Writing Guidelines for AI
1. **Start with the happy path** – Core functionality first
2. **Use existing test patterns** – Match test style in same directory
3. **Mock external dependencies** – Database, RabbitMQ, external APIs
4. **Test behaviors, not implementation** – Avoid brittle tests
5. **Keep tests fast** – Unit tests < 100ms, integration < 1s

**Example Test Checklist (in GitHub issue):**
```markdown
## Testing Requirements
- **Unit tests:** Flag behavior, admin/community page visibility
- **Integration tests:** None needed (UI-only change)
- **Manual verification:** Check localhost:8080, verify markets hidden
```

---

## Unit Test Requirements for New Functionality

When adding new functionality, you **MUST** add corresponding unit tests. This ensures code quality and prevents regressions.

### When to Add Unit Tests

Unit tests are **required** for:
- New utility functions or helpers
- New business logic (calculations, transformations, validations)
- New hooks (React custom hooks)
- New state management logic (Zustand stores)
- New API endpoint handlers
- Bug fixes (add regression test to prevent recurrence)

### Project Test Patterns

**Test Framework:** Vitest (for all unit tests)

**Test File Naming:**
- Place test files next to the code they test OR in the appropriate `test/unit/` directory
- Name pattern: `<filename>.spec.ts` or `<filename>.test.ts`

**Test Structure (follow existing patterns):**
```typescript
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';

describe('FunctionOrComponentName', () => {
  // Setup if needed
  beforeEach(() => {
    // Reset state, mocks, etc.
  });

  test('should describe expected behavior', () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).to.equal('expected output');
  });

  test('should handle edge case: specific scenario', () => {
    // Test edge cases
  });
});
```

**Test Location by Package:**
- `packages/commonwealth/test/unit/` - Frontend utilities, hooks, helpers
- `libs/model/test/` - Model logic, policies, lifecycle tests
- `libs/adapters/test/` - Adapter implementations
- `libs/schemas/test/` - Schema validations

**Running Tests:**
```bash
# Run all unit tests
pnpm -F commonwealth test-unit

# Run specific test file
pnpm -F commonwealth test-select packages/commonwealth/test/unit/path/to/test.spec.ts

# Run tests in watch mode
pnpm -F commonwealth test-select:watch

# Run model tests
pnpm -F model test-select libs/model/test/path/to/test.spec.ts
```

### Test Writing Guidelines

1. **Test behaviors, not implementation** – Focus on what the code does, not how
2. **Start with happy path** – Test the main use case first
3. **Cover edge cases** – Empty inputs, null values, boundary conditions
4. **Use descriptive test names** – `should return empty array when no items match filter`
5. **Keep tests fast** – Unit tests should run in < 100ms each
6. **Mock external dependencies** – Use `vi.mock()` for external modules
7. **Match existing patterns** – Look at similar tests in the codebase first

### Example: Adding Tests for a New Utility Function

If you add a new function in `client/scripts/helpers/formatCurrency.ts`:

```typescript
// packages/commonwealth/test/unit/helpers/formatCurrency.spec.ts
import { formatCurrency } from 'helpers/formatCurrency';
import { describe, expect, test } from 'vitest';

describe('formatCurrency', () => {
  test('should format USD amounts with dollar sign', () => {
    expect(formatCurrency(1000, 'USD')).to.equal('$1,000.00');
  });

  test('should format large numbers with appropriate separators', () => {
    expect(formatCurrency(1000000, 'USD')).to.equal('$1,000,000.00');
  });

  test('should handle zero amount', () => {
    expect(formatCurrency(0, 'USD')).to.equal('$0.00');
  });

  test('should handle negative amounts', () => {
    expect(formatCurrency(-500, 'USD')).to.equal('-$500.00');
  });
});
```

---

## UI Screenshot Requirements

When making **significant UI changes**, you must capture screenshots to document the visual changes for PR review. Use Playwright MCP to generate these screenshots.

### When to Capture Screenshots

Screenshots are **required** for:
- New pages or major page sections
- Significant layout changes
- New components that affect user workflows
- Visual bug fixes (before/after)
- Changes to navigation or user flows

Screenshots are **optional** for:
- Minor styling tweaks (color, spacing adjustments)
- Backend-only changes
- Non-visual code changes

### How to Capture Screenshots with Playwright MCP

**Prerequisites:**
- Local development server running (`pnpm start`)
- Playwright MCP tools available

**Process:**

1. **Start the development server** (if not already running):
   ```bash
   pnpm start
   # Wait for "Compiled successfully" message
   ```

2. **Navigate to the relevant page:**
   ```
   Use browser_navigate to go to http://localhost:8080/<path>
   ```

3. **Capture the screenshot:**
   ```
   Use browser_take_screenshot with descriptive filename
   ```

4. **For user flows, capture each step:**
   - Initial state
   - After user interaction (click, form fill, etc.)
   - Final state

**Screenshot Naming Convention:**
```
<feature>-<state>-<description>.png

Examples:
- markets-page-initial.png
- markets-page-after-filter.png
- user-profile-edit-modal.png
- dark-mode-toggle-enabled.png
```

**Screenshot Storage:**
- **IMPORTANT:** Screenshots must NOT be committed to the repository
- Upload screenshots directly to GitHub by attaching them to PR comments
- Use the GitHub-hosted URL (format: `https://github.com/user-attachments/assets/...`) in PR descriptions
- Reference screenshots in `.ai/progress.txt` by their GitHub URLs

### Example: Documenting a UI Flow

For a feature that adds a new "Markets" page:

```
1. Navigate to http://localhost:8080/markets
2. Take screenshot: markets-page-initial.png
3. Click on a market item
4. Take screenshot: markets-page-detail-view.png
5. Apply a filter
6. Take screenshot: markets-page-filtered.png
```

**Playwright MCP Commands:**
```
browser_navigate: {"url": "http://localhost:8080/markets"}
browser_snapshot: {} (to see current state and element refs)
browser_take_screenshot: {"filename": "markets-page-initial.png"}
browser_click: {"element": "Filter button", "ref": "<ref-from-snapshot>"}
browser_take_screenshot: {"filename": "markets-page-filtered.png"}
```

### Including Screenshots in PRs

When the PR contains significant UI changes:

1. **Upload screenshots to GitHub:**
   - Take screenshots using Playwright MCP `browser_take_screenshot`
   - Screenshots are saved to a temporary location (do NOT commit to repo)
   - Create a comment on the PR and drag-drop/paste the screenshot images
   - GitHub automatically uploads and generates URLs like: `https://github.com/user-attachments/assets/<uuid>`
   - Copy these GitHub-hosted URLs for use in PR description

2. **Reference in progress.txt (using GitHub URLs):**
   ```
   [2025-01-09] Feature: Add markets page
   - Screenshots uploaded to GitHub:
     - Initial: https://github.com/user-attachments/assets/abc123...
     - Filtered: https://github.com/user-attachments/assets/def456...
   - UI flow documented for reviewer
   ```

3. **Mention in commit message:**
   ```
   feat: add markets page with filtering

   - New /markets route with filterable list
   - Screenshots attached to PR for visual review
   ```

4. **Add to PR description (using GitHub-hosted URLs):**
   ```markdown
   ## Screenshots

   ### Markets Page - Initial View
   ![Initial](https://github.com/user-attachments/assets/abc123-uuid-here)

   ### Markets Page - With Filter Applied
   ![Filtered](https://github.com/user-attachments/assets/def456-uuid-here)
   ```

**Why GitHub-hosted URLs?**
- Keeps the repository clean (no binary files bloating git history)
- Screenshots persist as long as the PR/issue exists
- No need to manage screenshot directories or cleanup

---

## Progress Tracking & Memory Management

### Current: Append-Only progress.txt

**Format:**
```
[2025-01-06] Feature: Hide markets functionality
- Completed PRD task: ui/markets-feature-flag
- Created FLAG_MARKETS in feature-flags.ts
- Hidden admin markets page and community markets app
- Tests: Added flag behavior tests in client/scripts/hooks/useFlag.spec.ts
- Concerns: Existing markets data still in database (needs cleanup story)
- Next: Consider data migration or admin tool for existing markets
- Commit: abc123f
```

**When to Reset:**
- File exceeds 500 lines
- Quarterly planning cycle
- Major milestone completion (v1.0, etc.)

**Reset Process:**
1. AI generates summary: key decisions, architectural changes, open concerns
2. Move to `archive/progress-Q1-2025.txt`
3. Start fresh `progress.txt` with summary at top

---

## Execution Model: Series-Only (For Now)

**Decision: Strictly one task at a time** ✓

**Rationale:**
- Commonwealth's tight coupling (shared types, models, schemas) makes parallel work risky
- Small team = fewer merge conflicts with serial execution
- Human review is bottleneck, not AI execution speed
- Easier to debug and rollback single-task commits

**Future: Bounded Context Parallelism (When Ready)**

Define independent domains that can work in parallel:
- **UI Layer** (client/) ↔ **API Layer** (server/routes/)
- **Different Workers** (evmChainEvents ↔ discordBot)
- **Package Boundaries** (libs/model ↔ libs/adapters)

**Prerequisites:**
1. Create ownership map (which packages/directories can be parallel)
2. Set up git worktrees per AI session
3. Define merge strategy for concurrent work

**Not recommended until:**
- Team has 3+ months experience with serial workflow
- Merge conflicts drop to < 1 per week
- Test suite runs < 5 minutes

---

## Git Branching Strategy

### Automatic Branch Creation

The workflow **automatically creates and manages branches** based on GitHub issues using Commonwealth's standard naming conventions.

**Branch Naming Convention:**
```
<author>/<type>-<issue-number>-<title-slug>
```

**Examples:**
- `ro/feature-1234-add-user-authentication`
- `ro/fix-5678-button-alignment-issue`
- `jl/refactor-9012-state-management`
- `mb/chore-3456-update-dependencies`

### How It Works

1. **Author Determination** - Script checks in this order:
   - `AI_AUTHOR_INITIALS` environment variable (e.g., `export AI_AUTHOR_INITIALS=ro`)
   - `git config user.initials` (e.g., `git config --global user.initials ro`)
   - Derives from `git config user.name` (e.g., "Roger Oliver" → `ro`)
   - Falls back to first letter only if single name

2. **Type Determination** - Based on GitHub issue labels:
   - `type:feature` → `feature-*` branch (default if no type label)
   - `type:fix` → `fix-*` branch
   - `type:refactor` → `refactor-*` branch
   - `type:chore` → `chore-*` branch
   - `type:docs` → `docs-*` branch
   - `type:test` → `test-*` branch

3. **Slug Generation** - From issue title:
   - Converts to lowercase
   - Replaces spaces with hyphens
   - Removes special characters
   - Truncates to 50 characters
   - Example: "Add User Authentication Feature" → `add-user-authentication-feature`

4. **Branch Creation Logic:**
   ```bash
   # If on master/main branch:
   - Create new branch: ro/feature-1234-title-slug
   - Checkout automatically

   # If branch already exists:
   - Checkout existing branch (ro/feature-1234-title-slug)
   - Continue work on same branch

   # If on another feature branch:
   - Stay on current branch (don't create new one)
   - Warn user but allow work to continue
   ```

### Usage Examples

**Typical workflow (from master):**
```bash
# You're on master branch
$ git branch
* master

# Your git config has user.name = "Roger Oliver"
# Script derives: ro

# Run AI workflow
$ ./ai/run.sh 1234

# AI automatically:
# - Determines author: ro
# - Creates ro/feature-1234-add-markets-flag
# - Checks out the new branch
# - Does the work
# - Commits to that branch

Creating and checking out branch: ro/feature-1234-add-markets-flag
Working on: Add markets flag
✓ AI workflow completed
```

**Resume work on existing branch:**
```bash
# Branch already exists from previous run
$ ./ai/run.sh 1234

Branch 'ro/feature-1234-add-markets-flag' already exists, checking it out...
Working on: Add markets flag
✓ AI workflow completed
```

**Work on current branch:**
```bash
# You're already on a feature branch
$ git checkout ro/custom-branch-name
$ ./ai/run.sh 1234

Warning: You're currently on branch 'ro/custom-branch-name'
The AI will work on the current branch instead of creating a new one.
```

**Override author initials:**
```bash
# Temporarily use different initials
$ AI_AUTHOR_INITIALS=test ./ai/run.sh 1234
Creating and checking out branch: test/feature-1234-add-markets-flag

# Or set permanently for session
$ export AI_AUTHOR_INITIALS=ro
$ ./ai/run.sh 1234
Creating and checking out branch: ro/feature-1234-add-markets-flag
```

### Configuring Your Author Initials

**Option 1: Set git config (recommended)**
```bash
# Set once globally
git config --global user.initials ro

# Or per repository
git config user.initials ro
```

**Option 2: Use environment variable**
```bash
# Add to your ~/.zshrc or ~/.bashrc
export AI_AUTHOR_INITIALS=ro

# Or set per-run
AI_AUTHOR_INITIALS=ro ./ai/run.sh 1234
```

**Option 3: Let it auto-derive**
```bash
# If git user.name = "Roger Oliver"
# Script automatically derives: ro

# If git user.name = "Roger"
# Script automatically derives: r
```

### Manual Branch Control

If you prefer to create branches manually:

```bash
# Create your own branch first
git checkout -b ro/custom-branch-name

# AI will use your branch
./ai/run.sh 1234
```

### Best Practices

1. **Configure your initials once** - Set `git config user.initials`
   ```bash
   git config --global user.initials ro
   ```

2. **Add type labels to issues** - Ensures correct branch prefix
   - Add `type:feature`, `type:fix`, etc. when creating issues
   - Helps with organization and automated workflows

3. **Run from master/main** - Let AI create branches automatically
   - Pull latest: `git pull origin master`
   - Run workflow: `./ai/run.sh 1234` (AI creates `ro/feature-1234-title`)

4. **One issue per branch** - Maintains clean git history
   - Each issue gets its own branch
   - Easy to review and revert if needed

5. **Branch naming consistency** - Automatic naming ensures:
   - Author ownership visible (`ro/`, `jl/`, etc.)
   - Searchable by issue number
   - Clear type indication
   - Descriptive slugs from titles

---

## Handling Major Concerns

### 1. Output Alignment (Architectural Drift)

**Problem:** AI generates code that works but violates Commonwealth patterns

**Solutions:**
- **CLAUDE.md as source of truth** – AI reads patterns before implementing
- **Example-based learning** – AI must read similar existing code first
- **Validation hooks** – Linter catches naming violations, missing exports
- **Human review checklist** – Does this match our adapter pattern? State management? Component structure?

**Red flags to watch:**
- New abstractions when existing ones fit
- Inconsistent naming (CamelCase vs snake_case, etc.)
- Mixing state patterns (Zustand + useState for same concern)
- Bypassing adapters (direct Redis calls vs cache adapter)

### 2. False Completion Signals

**Problem:** AI thinks task is done but tests fail or behavior is wrong

**Mitigation:**
- **Hard requirement: Tests must pass** – run.sh enforces this
- **AI self-validates** – Must run checks and show output
- **Browser verification for UI** – AI prompts: "Verify in browser at localhost:8080"
- **Integration smoke tests** – Quick API health checks after changes

**Process:**
```bash
# AI must run and show output:
pnpm -r check-types  # ✓ or ✗ visible
pnpm test-unit       # ✓ or ✗ visible
pnpm build           # ✓ or ✗ visible (for critical changes)

# Only mark "passes": true if all green
```

### 3. Loss of Reasoning Context

**Problem:** Future AI runs lack context from previous decisions

**Solutions:**
- **progress.txt as handoff** – Each run leaves notes for next
- **Inline comments for "why"** – Complex decisions get JSDoc explanations
- **PRD technical_context field** – Capture architectural constraints
- **Git commit messages** – Rich descriptions of what and why

**Example good progress note:**
```
[2025-01-06] Feature: Cosmos chain integration
- Decision: Used CosmJS adapter pattern (not direct chain calls)
- Rationale: Keeps chain logic swappable, matches EVM pattern
- Concern: CosmJS types don't match our Chain interface perfectly
- Workaround: Type assertion in adapter with TODO to upstream fix
- Next contributor: Consider contributing Chain type to CosmJS
```

### 4. Conflict Generation

**Problem:** AI edits create merge conflicts with human work

**Solutions:**
- **Pull before run** – `git pull origin master` in run.sh
- **Short-lived branches** – AI tasks complete in < 1 day
- **Domain partitioning** – UI devs work on client/, backend devs on server/
- **Communication** – Team shares "working on X" in Slack before AI run

**If conflicts arise:**
1. Human resolves (AI doesn't have good conflict resolution)
2. Re-run validation after merge
3. Document in progress.txt if conflict revealed ambiguity

### 5. Spec Drift

**Problem:** AI updates PRD in inconsistent style

**Solution:**
- **Strict PRD schema** – JSON structure enforced
- **AI only updates "passes" field** – Doesn't rewrite descriptions
- **Human owns task creation** – AI executes, doesn't define scope
- **Version control** – Git tracks PRD changes for review

**Rule:** AI can mark tasks complete but cannot add/remove/reword tasks without human approval.

### 6. Trust & Authorship

**Problem:** Unclear what's AI vs human code

**Solutions:**
- **Commit attribution** – `Co-Authored-By: Claude Sonnet 4.5` in all AI commits
- **PR labels** – `ai-assisted` label on all AI-generated PRs
- **Human review required** – No direct merge to master from AI runs
- **Code ownership** – CODEOWNERS still applies, domain experts approve

**Transparency:**
- All AI runs tracked in progress.txt
- Git blame shows AI commits clearly
- PRs document "AI-generated, human-reviewed"

---

## Critical Concerns to Monitor

As this workflow evolves, watch these metrics:

### Success Signals ✓
- [ ] AI tasks complete without human intervention > 80% of time
- [ ] Type/test failures caught before commit > 95% of time
- [ ] PRs from AI require < 2 rounds of human changes
- [ ] progress.txt entries are useful for next contributor
- [ ] Team velocity increases (measured in story points/week)
- [ ] Merge conflicts remain < 1 per week

### Warning Signs ⚠️
- [ ] AI generates code that "looks right" but breaks in production
- [ ] Tests become brittle (failing for unrelated changes)
- [ ] progress.txt entries are copy-paste boilerplate
- [ ] Team spends more time debugging AI than writing code
- [ ] PRD drifts out of sync with GitHub issues
- [ ] Developers lose understanding of their own codebase

### Immediate Action Items 🚨
If any of these occur, pause AI workflow and reassess:
- Critical production bug from AI-generated code
- > 3 consecutive AI runs fail validation
- Developer cannot explain AI-generated code in PR review
- Tests give false positives (passing but behavior wrong)

---

## Governance & Evolution

### Monthly Workflow Review
- Team retrospective on AI-assisted tasks
- Review progress.txt for patterns (repeated issues, common wins)
- Adjust PRD task granularity if needed
- Update CLAUDE.md with new patterns learned

### Quarterly Planning
- Rotate progress.txt with summary
- Evaluate parallel execution readiness
- Consider expanding AI scope (e.g., database migrations)
- Update testing contract based on coverage gaps

### Decision Authority
- **AI decides:** Task selection, implementation approach (within patterns)
- **Human decides:** PRD task creation, branch naming, PR merging, architecture changes
- **Hybrid:** AI proposes, human approves (new abstractions, refactoring, dependency additions)

---

## Resources

- **CLAUDE.md** – Commonwealth-specific patterns and setup
- **.ai/quickstart.md** – Quick start guide for new developers
- **.ai/readme.md** – This comprehensive guide
- **GitHub Issues** – Task backlog and business context
- **.ai/progress.txt** – Execution history and shared notes
- **.ai/run.sh** – Main workflow automation script
- **.ai/create-ticket.sh** – AI-powered ticket generator
- **.ai/setup-labels.sh** – One-time label setup script
- **.github/ISSUE_TEMPLATE/ai-task.md** – Issue template for AI tasks
- **Figma** – UI design source of truth

---

## FAQ

**Q: Why GitHub Issues instead of a local task file?**
A: Single source of truth. No sync overhead, real-time team visibility, automatic PR linking, and uses tools you already have (labels, milestones, assignments).

**Q: Can AI work on database migrations?**
A: Not yet. Migrations are high-risk (production data). Humans should write migrations, AI can write model changes and tests.

**Q: What if AI picks the wrong task?**
A: Change labels (remove `ai-ready`) or pass a specific issue number to `run.sh` to override auto-selection.

**Q: How do we handle AI-generated bugs?**
A: Same as human bugs: fix, add regression test, document in progress.txt. Consider if task was under-specified in the GitHub issue.

**Q: Can we use AI for code review?**
A: Not in this workflow. Human review is required for all PRs (AI-generated or not). Future: Consider AI as first-pass reviewer.

**Q: What about security concerns?**
A: AI should not handle: API keys, auth logic without review, SQL query construction (injection risk), user input validation. Always human-review security-sensitive code.

**Q: How do we prevent AI from working on the same task twice?**
A: Labels prevent this. When AI completes a task, it changes the label from `ai-ready` to `ai-completed`, removing it from the auto-selection pool.

**Q: Can multiple developers run AI workflows simultaneously?**
A: Yes, if they work on different branches and different issues. GitHub labels show which issues are `ai-in-progress` to avoid conflicts.

**Q: How does branch naming work?**
A: Branches are automatically created using the pattern `<author>/<type>-<issue-number>-<title-slug>`. The author is derived from your git config, the type comes from GitHub labels (`type:feature`, `type:fix`, etc.), and the slug is generated from the issue title. Example: Issue #1234 "Add User Auth" with label `type:feature` creates branch `ro/feature-1234-add-user-auth`.

**Q: What if I want to use my own branch name?**
A: Create and checkout your branch manually before running `./ai/run.sh`. The AI will detect you're not on master/main and use your current branch instead of creating a new one.

**Q: Can I work on multiple issues in the same branch?**
A: Not recommended. The workflow is designed for one issue per branch to maintain clean git history and easy rollback. If you need to work on related issues, consider creating a parent issue that links to sub-issues.

**Q: How do I quickly create a compliant GitHub issue?**
A: Use the AI ticket generator: `./ai/create-ticket.sh "Your description"`. It analyzes your request, infers the correct type/priority/risk/category, generates implementation steps following Commonwealth patterns, adds testing requirements, and creates the issue with proper labels.

**Q: What's the difference between create-ticket.sh and manually creating issues?**
A: `create-ticket.sh` uses AI to understand your description and generate a detailed, compliant issue automatically. Manual creation gives you full control but requires understanding all the Commonwealth patterns and conventions. For most tasks, the AI generator is faster and more consistent.

---

---

**Next Steps:**

1. Create GitHub labels (see Quick Start section)
2. Create issue template (`.github/ISSUE_TEMPLATE/ai-task.md`)
3. Create first issue with `ai-ready` label
4. Run `./ai/run.sh <issue-number>` or `./ai/run.sh --auto`
