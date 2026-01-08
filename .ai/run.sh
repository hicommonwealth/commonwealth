#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    echo "Then authenticate: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Parse arguments
if [ "$1" == "--auto" ]; then
    echo -e "${YELLOW}Auto-selecting highest priority ai-ready issue...${NC}"

    # Try to find critical priority first
    ISSUE_NUM=$(gh issue list \
        --label "ai-ready" \
        --json number,labels,title \
        --jq 'map(select(.labels | map(.name) | contains(["priority:critical"]))) | .[0].number' 2>/dev/null)

    # Fallback to high priority
    if [ -z "$ISSUE_NUM" ] || [ "$ISSUE_NUM" == "null" ]; then
        ISSUE_NUM=$(gh issue list \
            --label "ai-ready,priority:high" \
            --limit 1 \
            --json number \
            --jq '.[0].number' 2>/dev/null)
    fi

    # Fallback to any ai-ready issue
    if [ -z "$ISSUE_NUM" ] || [ "$ISSUE_NUM" == "null" ]; then
        ISSUE_NUM=$(gh issue list \
            --label "ai-ready" \
            --limit 1 \
            --json number \
            --jq '.[0].number' 2>/dev/null)
    fi

    if [ -z "$ISSUE_NUM" ] || [ "$ISSUE_NUM" == "null" ]; then
        echo -e "${RED}Error: No issues found with 'ai-ready' label${NC}"
        echo "Create a GitHub issue and add the 'ai-ready' label to get started."
        exit 1
    fi

    echo -e "${GREEN}Selected issue #${ISSUE_NUM}${NC}"
elif [ -z "$1" ]; then
    echo -e "${RED}Error: Issue number required${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 <issue-number>    # Work on specific issue"
    echo "  $0 --auto            # Auto-select highest priority ai-ready issue"
    echo ""
    echo "Example:"
    echo "  $0 1234"
    exit 1
else
    ISSUE_NUM=$1
fi

# Fetch issue details
echo -e "${YELLOW}Fetching issue #${ISSUE_NUM}...${NC}"
ISSUE_DATA=$(gh issue view $ISSUE_NUM --json title,body,labels,state 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Could not fetch issue #${ISSUE_NUM}${NC}"
    echo "Make sure the issue exists and you have access to it."
    exit 1
fi

# Check if issue is closed
ISSUE_STATE=$(echo "$ISSUE_DATA" | jq -r '.state')
if [ "$ISSUE_STATE" == "CLOSED" ]; then
    echo -e "${RED}Error: Issue #${ISSUE_NUM} is already closed${NC}"
    exit 1
fi

ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body // ""')
ISSUE_LABELS=$(echo "$ISSUE_DATA" | jq -r '.labels[].name')

echo -e "${GREEN}Working on: ${ISSUE_TITLE}${NC}"
echo ""

# Get author identifier (from env var or git config)
# Priority: AI_AUTHOR_INITIALS env var > git config user.initials > derive from git user.name
if [ -n "$AI_AUTHOR_INITIALS" ]; then
    AUTHOR="$AI_AUTHOR_INITIALS"
elif git config --get user.initials &> /dev/null; then
    AUTHOR=$(git config --get user.initials)
else
    # Derive initials from git user name (first letter of first name + first letter of last name)
    GIT_NAME=$(git config --get user.name 2>/dev/null || echo "dev")
    FIRST_INITIAL=$(echo "$GIT_NAME" | awk '{print tolower(substr($1,1,1))}')
    LAST_INITIAL=$(echo "$GIT_NAME" | awk '{print tolower(substr($NF,1,1))}')
    if [ "$FIRST_INITIAL" != "$LAST_INITIAL" ] && [ -n "$LAST_INITIAL" ]; then
        AUTHOR="${FIRST_INITIAL}${LAST_INITIAL}"
    else
        AUTHOR="$FIRST_INITIAL"
    fi
fi

# Determine branch type from labels
BRANCH_TYPE="feature"
if echo "$ISSUE_LABELS" | grep -q "type:fix"; then
    BRANCH_TYPE="fix"
elif echo "$ISSUE_LABELS" | grep -q "type:refactor"; then
    BRANCH_TYPE="refactor"
elif echo "$ISSUE_LABELS" | grep -q "type:chore"; then
    BRANCH_TYPE="chore"
elif echo "$ISSUE_LABELS" | grep -q "type:docs"; then
    BRANCH_TYPE="docs"
elif echo "$ISSUE_LABELS" | grep -q "type:test"; then
    BRANCH_TYPE="test"
fi

# Create branch name slug from issue title
# Convert to lowercase, replace spaces with hyphens, remove special chars
TITLE_SLUG=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 -]//g' | sed 's/ \+/-/g' | cut -c1-50)
BRANCH_NAME="${AUTHOR}/${BRANCH_TYPE}-${ISSUE_NUM}-${TITLE_SLUG}"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

if [ "$CURRENT_BRANCH" != "master" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}Warning: You're currently on branch '${CURRENT_BRANCH}'${NC}"
    echo "The AI will work on the current branch instead of creating a new one."
    echo ""
    BRANCH_NAME="$CURRENT_BRANCH"
else
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        echo -e "${YELLOW}Branch '${BRANCH_NAME}' already exists, checking it out...${NC}"
        git checkout "$BRANCH_NAME" 2>/dev/null || {
            echo -e "${RED}Error: Could not checkout branch${NC}"
            exit 1
        }
    else
        echo -e "${GREEN}Creating and checking out branch: ${BRANCH_NAME}${NC}"
        git checkout -b "$BRANCH_NAME" 2>/dev/null || {
            echo -e "${RED}Error: Could not create branch${NC}"
            exit 1
        }
    fi
    echo ""
fi

# Update issue label to ai-in-progress
gh issue edit $ISSUE_NUM --remove-label "ai-ready" --add-label "ai-in-progress" 2>/dev/null || true

# Run Claude with issue context
claude --permission-mode acceptEdits "
GitHub Issue #${ISSUE_NUM}: ${ISSUE_TITLE}

${ISSUE_BODY}

@.ai/progress.txt

INSTRUCTIONS:

1. Implement the task described in the GitHub issue above. Follow the implementation steps if provided.
   - Read existing code before making changes (NEVER propose changes to unread files)
   - Follow patterns from CLAUDE.md
   - Use existing abstractions before creating new ones
   - Respect package boundaries

2. Validate that your implementation is correct:
   - Run: pnpm -r check-types (must pass)
   - Run: pnpm lint-branch-warnings (must pass)
   - Run: pnpm -F commonwealth test-unit (must pass for changed modules)
   - Run: pnpm -F model test-select {test-name} (must pass for changed modules)
   - For API/database changes, run integration tests
   - Show the output of these commands

3. Append progress notes to .ai/progress.txt with:
   - [YYYY-MM-DD] Feature: <brief description>
   - Completed GitHub issue #${ISSUE_NUM}
   - Key implementation decisions made
   - Files changed (main areas)
   - Tests added/updated
   - Any concerns for reviewers
   - Commit hash (after committing)

4. Make a git commit with this format:
   <type>: <description>

   Completed GitHub issue #${ISSUE_NUM}
   - Summary of changes
   - Files/areas affected
   - Tests: <test coverage added>

   🤖 Generated with Claude Code
   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

   Types: feat, fix, refactor, test, chore, docs

5. After successful commit, update the GitHub issue:
   - Add a comment with completion details and commit hash
   - Change label from 'ai-in-progress' to 'ai-completed'

CRITICAL RULES:
- ONLY WORK ON THIS SINGLE ISSUE
- Never commit if types/tests fail
- Read files before editing them
- Match existing code style and patterns
"

# Check if Claude succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ AI workflow completed${NC}"
    echo ""

    # Get the latest commit hash
    COMMIT_HASH=$(git log -1 --format=%h 2>/dev/null)
    BRANCH_NAME=$(git branch --show-current 2>/dev/null)

    # Post completion comment to GitHub
    COMMENT="✅ AI implementation complete

- **Commit**: ${COMMIT_HASH}
- **Branch**: ${BRANCH_NAME}
- **Details**: See \`.ai/progress.txt\` for implementation notes

Ready for human review."

    gh issue comment $ISSUE_NUM --body "$COMMENT" 2>/dev/null || echo -e "${YELLOW}Warning: Could not add comment to issue${NC}"
    gh issue edit $ISSUE_NUM --remove-label "ai-in-progress" --add-label "ai-completed" 2>/dev/null || echo -e "${YELLOW}Warning: Could not update issue labels${NC}"

    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Review changes: git diff HEAD~1"
    echo "  2. Test manually if needed: pnpm start"
    echo "  3. Push: git push -u origin ${BRANCH_NAME}"
    echo "  4. Create PR: gh pr create --fill"
else
    echo ""
    echo -e "${RED}✗ AI workflow failed${NC}"

    # Mark issue as blocked
    gh issue edit $ISSUE_NUM --remove-label "ai-in-progress" --add-label "ai-blocked" 2>/dev/null || true

    COMMENT="❌ AI implementation blocked

The AI encountered issues and could not complete this task automatically.
Human intervention required.

See conversation history for details."

    gh issue comment $ISSUE_NUM --body "$COMMENT" 2>/dev/null || true

    exit 1
fi
