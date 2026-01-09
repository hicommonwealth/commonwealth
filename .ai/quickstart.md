# Commonwealth AI Workflow - Quick Start Guide

Get started with AI-assisted development on Commonwealth in 5 minutes.

---

## Prerequisites

- Node.js 22.x installed
- pnpm 9.14.2 installed
- Docker running (for PostgreSQL, Redis, RabbitMQ)
- GitHub CLI (`gh`) installed: `brew install gh`
- Claude Code CLI installed and authenticated

---

## First-Time Setup (One-Time)

### 1. Configure Your Git Identity

```bash
# Set your initials for branch naming (e.g., "ro" for Roger Oliver)
git config --global user.initials ro

# Verify it's set
git config --get user.initials
```

### 2. Install Dependencies

```bash
# Install all packages
pnpm install

# Verify everything works
pnpm -r check-types
pnpm lint-branch-warnings
```

### 3. Authenticate with GitHub

```bash
# If not already authenticated
gh auth login

# Verify authentication
gh auth status
```

---

## Daily Workflow

### Option 1: Create Issue Manually

1. **Go to GitHub Issues**
   - Click "New Issue"
   - Select "AI-Assisted Task" template

2. **Fill in the template**
   - Description: Clear explanation of what needs to be done
   - Technical Context: Choose type, category, priority, risk
   - Implementation Steps: Break down the work
   - Testing Requirements: Specify test coverage

3. **Add labels**
   ```
   ai-ready, type:feature, priority:high, risk:low, area:ui
   ```

4. **Run AI workflow**
   ```bash
   git checkout master && git pull
   ./ai/run.sh <issue-number>
   ```

### Option 2: Use AI to Create Issue (Recommended)

1. **Generate a compliant issue from a description**
   ```bash
   ./ai/create-ticket.sh "Add a feature flag to hide the markets functionality"
   ```

2. **Review and confirm the generated issue**
   - AI analyzes your request
   - Generates detailed issue following Commonwealth patterns
   - Infers correct type, priority, risk, category
   - Creates implementation steps and testing requirements

3. **Run AI workflow**
   ```bash
   ./ai/run.sh <issue-number>
   ```

### Option 3: Auto-Select Highest Priority Issue

```bash
git checkout master && git pull
./ai/run.sh --auto
```

AI will automatically:
- Find the highest priority `ai-ready` issue
- Create branch: `ro/feature-1234-title-slug`
- Implement the feature
- **Add unit tests** for new functionality
- **Capture UI screenshots** for significant UI changes (using Playwright MCP)
- Run tests and type checks
- Commit changes
- Update GitHub issue

---

## After AI Completes

### 1. Review the Changes

```bash
# Verify you're on the right branch
git branch

# Review what changed
git diff HEAD~1

# See commit details
git log -1 --stat

# Check the GitHub issue comment
gh issue view <issue-number>
```

### 2. Review Unit Tests and Screenshots

```bash
# Check if new tests were added
git diff HEAD~1 --name-only | grep '.spec.ts'

# Run the new tests
pnpm -F commonwealth test-unit

# Check for captured screenshots (if UI changes)
ls *.png 2>/dev/null || echo "No screenshots in current directory"

# Review progress notes for details
cat .ai/progress.txt | tail -30
```

### 3. Test Manually (if needed)

```bash
# Start the application
pnpm start

# Visit http://localhost:8080
# Verify the changes work as expected

# Run tests
pnpm -F commonwealth test-unit
pnpm -F model test
etc...
```

### 4. Push and Create PR

```bash
# Push your branch
git push -u origin $(git branch --show-current)

# Create PR with proper format (MUST include "Closes #<issue-number>")
gh pr create --title "feat: description of changes" --body "$(cat <<'EOF'
## Summary
- Brief description of changes

## Test Plan
- [ ] Unit tests pass
- [ ] Type checks pass
- [ ] Manual verification completed

Closes #<issue-number>

🤖 Generated with Claude Code
EOF
)"

# Or use --fill for simple PRs (manually add "Closes #" to description)
gh pr create --fill
```

**IMPORTANT:** Always include `Closes #<issue-number>` in the PR body to auto-close the GitHub issue when merged.

### 5. Merge After Review

- Wait for human review
- Address any feedback
- Merge the PR
- GitHub issue closes automatically

---

## Common Commands

```bash
# Create an AI-generated issue
./ai/create-ticket.sh "Your description here"

# Work on specific issue
./ai/run.sh 1234

# Auto-select highest priority
./ai/run.sh --auto

# View issue details
gh issue view 1234

# List all ai-ready issues
gh issue list --label "ai-ready"

# Check branch status
git status
git branch

# Review changes
git diff HEAD~1
git log -1

# Push and PR (include "Closes #<issue>" in PR body)
git push -u origin $(git branch --show-current)
gh pr create --fill  # Add "Closes #1234" to PR description
```

---

## Branch Naming Convention

Branches are automatically created as:
```
<author>/<type>-<issue-number>-<title-slug>
```

**Examples:**
- `ro/feature-1234-add-user-authentication`
- `ro/fix-5678-button-alignment-issue`
- `jl/refactor-9012-state-management`

The script automatically:
- Uses your `git config user.initials` (set in step 1)
- Determines type from issue labels (`type:feature`, `type:fix`, etc.)
- Generates slug from issue title
- Creates and checks out the branch

---

## Troubleshooting

### "gh: command not found"
```bash
brew install gh
gh auth login
```

### "Could not create branch"
```bash
# Make sure you're on master
git checkout master
git pull origin master

# Check for uncommitted changes
git status
```

### "No issues found with 'ai-ready' label"
```bash
# Create an issue first
./ai/create-ticket.sh "Your feature description"

# Or manually add 'ai-ready' label to existing issues
gh issue edit <number> --add-label "ai-ready"
```

### "Types check failed"
```bash
# AI should fix these automatically, but if not:
pnpm -r check-types

# Fix the errors manually, then re-run
./ai/run.sh <issue-number>
```

### Branch naming issues
```bash
# Check your initials are set
git config --get user.initials

# If not set:
git config --global user.initials ro
```

---

## Examples

### Example 1: Create and Work on a Feature

```bash
# Generate an issue
./ai/create-ticket.sh "Add dark mode toggle to user settings"

# Output shows issue #1234 created

# Work on it
git checkout master && git pull
./ai/run.sh 1234

# AI creates: ro/feature-1234-add-dark-mode-toggle
# AI implements, adds tests, captures screenshots, and commits

# Review and push
git diff HEAD~1
git push -u origin ro/feature-1234-add-dark-mode-toggle

# Create PR with Closes # to auto-close issue
gh pr create --title "feat: add dark mode toggle" --body "Closes #1234"
```

### Example 2: Fix a Bug

```bash
# Create bug fix issue
./ai/create-ticket.sh "Fix button alignment on mobile devices"

# AI detects type:fix from context
# Issue #5678 created

# Run workflow
./ai/run.sh 5678

# AI creates: ro/fix-5678-button-alignment-mobile
# Review, test, push
```

### Example 3: Let AI Choose What to Work On

```bash
# Start from master
git checkout master && git pull

# Let AI pick highest priority
./ai/run.sh --auto

# AI finds issue #9012 with priority:critical
# Creates ro/feature-9012-title-slug
# Implements and commits
```

---

## Next Steps

1. **Read the full documentation**: `.ai/readme.md`
2. **Understand Commonwealth patterns**: `CLAUDE.md`
3. **Create your first issue**: `./ai/create-ticket.sh "Your idea"`
4. **Run the workflow**: `./ai/run.sh <issue-number>`
5. **Join the team workflow**: Help refine and improve the process!

---

**Happy coding! 🚀**
