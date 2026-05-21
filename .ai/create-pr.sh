#!/bin/bash
set -e

# =============================================================================
# Create Pull Request Script
# =============================================================================
# Automates GitHub PR creation from the current branch.
#
# Features:
# - Extracts ticket number from branch name (e.g., feature/1234-description)
# - Adds "Closes #ticket" to PR body following GitHub conventions
# - Assigns PR to the executing user
# - Assigns the referenced ticket/issue to the executing user
#
# Usage:
#   ./ai/create-pr.sh                    # Interactive mode
#   ./ai/create-pr.sh --title "My PR"    # With custom title
#   ./ai/create-pr.sh --draft            # Create as draft PR
#   ./ai/create-pr.sh --help             # Show help
#
# Branch naming conventions supported:
#   - <author>/<type>-<issue>-<description>  (e.g., ro/feature-1234-add-auth)
#   - <type>/<issue>-<description>           (e.g., feature/1234-add-auth)
#   - <issue>-<description>                  (e.g., 1234-add-auth)
#   - Any branch with a number               (extracts first number found)
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DRAFT_MODE=false
CUSTOM_TITLE=""
BASE_BRANCH="master"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --draft)
            DRAFT_MODE=true
            shift
            ;;
        --title)
            CUSTOM_TITLE="$2"
            shift 2
            ;;
        --base)
            BASE_BRANCH="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Create a GitHub Pull Request from the current branch."
            echo ""
            echo "Options:"
            echo "  --draft         Create PR as draft"
            echo "  --title TEXT    Use custom PR title (default: derived from branch/commits)"
            echo "  --base BRANCH   Base branch for PR (default: master)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Features:"
            echo "  - Extracts ticket number from branch name"
            echo "  - Adds 'Closes #<ticket>' to PR body"
            echo "  - Assigns PR to you (@me)"
            echo "  - Assigns referenced issue to you"
            echo ""
            echo "Supported branch naming patterns:"
            echo "  - ro/feature-1234-description"
            echo "  - feature/1234-description"
            echo "  - fix-1234-bug-name"
            echo "  - 1234-some-feature"
            echo ""
            echo "Examples:"
            echo "  $0                           # Standard PR creation"
            echo "  $0 --draft                   # Create as draft PR"
            echo "  $0 --title 'My custom title' # With custom title"
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option: $1${NC}"
            echo "Run '$0 --help' for usage information."
            exit 1
            ;;
    esac
done

# =============================================================================
# Pre-flight checks
# =============================================================================

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Check if we're on a branch (not detached HEAD)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
    echo -e "${RED}Error: Detached HEAD state - please checkout a branch first${NC}"
    echo "Run: git checkout -b <branch-name>"
    exit 1
fi

# Check if we're on the base branch
if [ "$CURRENT_BRANCH" == "$BASE_BRANCH" ] || [ "$CURRENT_BRANCH" == "main" ]; then
    echo -e "${RED}Error: Cannot create PR from '$CURRENT_BRANCH' branch${NC}"
    echo "Please checkout a feature branch first."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled. Commit or stash your changes first.${NC}"
        exit 0
    fi
fi

# Check if branch has upstream tracking
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} &> /dev/null; then
    echo -e "${YELLOW}Branch '$CURRENT_BRANCH' has no upstream. Pushing to origin...${NC}"
    git push -u origin "$CURRENT_BRANCH" || {
        echo -e "${RED}Error: Failed to push branch to origin${NC}"
        exit 1
    }
    echo ""
fi

# Check if PR already exists for this branch
EXISTING_PR=$(gh pr list --head "$CURRENT_BRANCH" --json number,url --jq '.[0]' 2>/dev/null)
if [ -n "$EXISTING_PR" ] && [ "$EXISTING_PR" != "null" ]; then
    PR_URL=$(echo "$EXISTING_PR" | jq -r '.url')
    PR_NUM=$(echo "$EXISTING_PR" | jq -r '.number')
    echo -e "${YELLOW}A PR already exists for this branch:${NC}"
    echo -e "  PR #$PR_NUM: $PR_URL"
    echo ""
    read -p "Open existing PR in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh pr view "$PR_NUM" --web
    fi
    exit 0
fi

# =============================================================================
# Extract ticket number from branch name
# =============================================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Commonwealth PR Creator                           ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

echo -e "${YELLOW}Analyzing branch: ${CURRENT_BRANCH}${NC}"

# Extract ticket number using various patterns
# Supported patterns:
#   - ro/feature-1234-description (author/type-number-desc)
#   - feature/1234-description (type/number-desc)
#   - feature-1234-description (type-number-desc)
#   - 1234-description (number-desc)
#   - Any branch with a number (fallback)
#
# Uses grep/sed for portability across bash versions (macOS bash 3.2 compatibility)

TICKET_NUM=""

# Extract the number that appears after a type prefix (feature-, fix-, etc.)
# Pattern: look for -<number>- or /<number>- sequences
if echo "$CURRENT_BRANCH" | grep -qE '[-/][0-9]+[-/]'; then
    # Extract the number between delimiters
    TICKET_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '[-/][0-9]+[-/]' | head -1 | grep -oE '[0-9]+')
elif echo "$CURRENT_BRANCH" | grep -qE '[-/][0-9]+$'; then
    # Number at end after delimiter
    TICKET_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+$')
elif echo "$CURRENT_BRANCH" | grep -qE '^[0-9]+[-/]'; then
    # Number at start before delimiter
    TICKET_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '^[0-9]+')
elif echo "$CURRENT_BRANCH" | grep -qE '[0-9]+'; then
    # Fallback: first number found anywhere
    TICKET_NUM=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+' | head -1)
fi

if [ -n "$TICKET_NUM" ]; then
    echo -e "${GREEN}Found ticket number: #${TICKET_NUM}${NC}"

    # Verify the issue exists
    if gh issue view "$TICKET_NUM" &> /dev/null; then
        ISSUE_TITLE=$(gh issue view "$TICKET_NUM" --json title --jq '.title' 2>/dev/null)
        echo -e "  Issue title: $ISSUE_TITLE"
    else
        echo -e "${YELLOW}  Warning: Issue #${TICKET_NUM} not found (may be in different repo)${NC}"
    fi
else
    echo -e "${YELLOW}No ticket number found in branch name${NC}"
    echo "  Branch: $CURRENT_BRANCH"
    echo "  PR will be created without issue reference."
fi
echo ""

# =============================================================================
# Generate PR title
# =============================================================================

if [ -n "$CUSTOM_TITLE" ]; then
    PR_TITLE="$CUSTOM_TITLE"
else
    # Try to generate title from branch name
    # Remove author prefix (e.g., ro/)
    TITLE_SLUG=$(echo "$CURRENT_BRANCH" | sed 's|^[a-zA-Z]*/||')
    # Remove type prefix (e.g., feature-, fix-)
    TITLE_SLUG=$(echo "$TITLE_SLUG" | sed 's|^[a-zA-Z]*-||')
    # Remove ticket number prefix (e.g., 1234-)
    TITLE_SLUG=$(echo "$TITLE_SLUG" | sed 's|^[0-9]*-||')
    # Convert dashes to spaces and capitalize first letter
    PR_TITLE=$(echo "$TITLE_SLUG" | tr '-' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

    # If we have a ticket, try to get a better title from the issue
    if [ -n "$TICKET_NUM" ] && gh issue view "$TICKET_NUM" &> /dev/null; then
        ISSUE_TITLE=$(gh issue view "$TICKET_NUM" --json title --jq '.title' 2>/dev/null)
        if [ -n "$ISSUE_TITLE" ]; then
            PR_TITLE="$ISSUE_TITLE"
        fi
    fi

    # Fallback to last commit message if title is empty
    if [ -z "$PR_TITLE" ] || [ "$PR_TITLE" == " " ]; then
        PR_TITLE=$(git log -1 --format=%s)
    fi
fi

echo -e "${YELLOW}PR Title:${NC} $PR_TITLE"
echo ""

# =============================================================================
# Generate PR body
# =============================================================================

# Get list of commits on this branch not in base
COMMITS=$(git log "$BASE_BRANCH..$CURRENT_BRANCH" --oneline 2>/dev/null || git log -10 --oneline)
COMMIT_COUNT=$(echo "$COMMITS" | wc -l | tr -d ' ')

# Build the PR body
PR_BODY="## Summary"
PR_BODY+="\n"

# Add closing reference if we have a ticket
if [ -n "$TICKET_NUM" ]; then
    PR_BODY+="\nCloses #${TICKET_NUM}"
    PR_BODY+="\n"
fi

# Add commit summary section if multiple commits
if [ "$COMMIT_COUNT" -gt 1 ]; then
    PR_BODY+="\n### Changes"
    PR_BODY+="\n"
    while IFS= read -r commit; do
        PR_BODY+="\n- $commit"
    done <<< "$COMMITS"
    PR_BODY+="\n"
fi

# Add test plan section
PR_BODY+="\n## Test plan"
PR_BODY+="\n- [ ] Type check passes (\`pnpm -r check-types\`)"
PR_BODY+="\n- [ ] Lint passes (\`pnpm lint-branch-warnings\`)"
PR_BODY+="\n- [ ] Unit tests pass (\`pnpm -F commonwealth test-unit\`)"
PR_BODY+="\n"

# Add generated note
PR_BODY+="\n---"
PR_BODY+="\n*Generated with [Claude Code](https://claude.ai/code)*"

# =============================================================================
# Confirm and create PR
# =============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PR Preview:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Title: $PR_TITLE"
echo -e "Base:  $BASE_BRANCH"
echo -e "Head:  $CURRENT_BRANCH"
if [ "$DRAFT_MODE" = true ]; then
    echo -e "Mode:  Draft"
fi
if [ -n "$TICKET_NUM" ]; then
    echo -e "Closes: #$TICKET_NUM"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Create this PR? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Creating PR...${NC}"

# Build gh pr create command
GH_ARGS=("pr" "create")
GH_ARGS+=("--title" "$PR_TITLE")
GH_ARGS+=("--body" "$(echo -e "$PR_BODY")")
GH_ARGS+=("--base" "$BASE_BRANCH")
GH_ARGS+=("--assignee" "@me")

if [ "$DRAFT_MODE" = true ]; then
    GH_ARGS+=("--draft")
fi

# Create the PR
PR_URL=$(gh "${GH_ARGS[@]}" 2>&1)

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ PR created successfully!${NC}"
    echo -e "${BLUE}PR URL:${NC} $PR_URL"

    # Extract PR number from URL
    PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$')

    # Assign the referenced issue to the current user
    if [ -n "$TICKET_NUM" ]; then
        echo ""
        echo -e "${YELLOW}Assigning issue #${TICKET_NUM} to you...${NC}"
        if gh issue edit "$TICKET_NUM" --add-assignee "@me" 2>/dev/null; then
            echo -e "${GREEN}✓ Issue #${TICKET_NUM} assigned to you${NC}"
        else
            echo -e "${YELLOW}  Could not assign issue (may not exist or insufficient permissions)${NC}"
        fi
    fi

    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Review PR: gh pr view $PR_NUMBER"
    echo "  2. Add reviewers: gh pr edit $PR_NUMBER --add-reviewer <username>"
    echo "  3. View in browser: gh pr view $PR_NUMBER --web"
else
    echo ""
    echo -e "${RED}✗ Failed to create PR${NC}"
    echo "$PR_URL"
    exit 1
fi
