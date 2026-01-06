#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if description provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Description required${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 \"<description>\""
    echo ""
    echo "Example:"
    echo "  $0 \"Add a feature flag to hide the markets functionality\""
    echo "  $0 \"Fix the button alignment issue on the user profile page\""
    echo "  $0 \"Refactor state management to use Zustand consistently\""
    exit 1
fi

DESCRIPTION="$1"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Commonwealth AI Ticket Generator                  ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${YELLOW}Analyzing your request...${NC}"
echo ""

# Create a temporary file for the AI-generated issue
TEMP_FILE=$(mktemp)

# Use Claude to generate a compliant GitHub issue
claude "
You are creating a GitHub issue for the Commonwealth project following their AI workflow conventions.

User Request: ${DESCRIPTION}

Based on the CLAUDE.md context and the Commonwealth codebase knowledge, create a detailed GitHub issue that follows this exact template:

## Description
[Clear, user-facing description of what needs to be built or fixed]

## Technical Context
**Type:** feature | fix | refactor | chore | docs | test
**Category:** ui | api | database | workers | shared | testing | infra
**Priority:** critical | high | medium | low
**Risk:** low | medium | high
**Packages:** [Which packages will be affected]

### Architecture Notes
- [Adapter patterns to follow, Commonwealth-specific patterns]
- [Related systems affected]
- [Constraints or invariants from CLAUDE.md]

## Implementation Steps
- [ ] Step 1: Specific technical task with file/location hints
- [ ] Step 2: Specific technical task with file/location hints
- [ ] Step 3: Specific technical task with file/location hints

## Testing Requirements
- **Unit tests:** [What behaviors to test, which files]
- **Integration tests:** [What integration points to verify]
- **Manual verification:** [What to check in browser/logs]

## Dependencies
**Blocked by:** (if applicable)
**Blocks:** (if applicable)

## Acceptance Criteria
- [ ] Types check passes (pnpm -r check-types)
- [ ] Linting passes (pnpm lint-branch-warnings)
- [ ] Unit tests pass and new tests added
- [ ] [Any other specific criteria]

IMPORTANT GUIDELINES:
1. Infer the Type based on the request:
   - New functionality = feature
   - Bug fix = fix
   - Code improvement without behavior change = refactor
   - Dependencies, tooling, maintenance = chore
   - Documentation = docs
   - Testing = test

2. Infer the Category based on what's being changed:
   - React components, UI = ui
   - API routes, tRPC, Express = api
   - Sequelize models, migrations = database
   - Background workers, RabbitMQ = workers
   - Libs, shared utilities = shared

3. Set Priority:
   - Blocking production issues = critical
   - Important features or significant bugs = high
   - Nice-to-have improvements = medium
   - Minor tweaks = low

4. Set Risk:
   - UI changes, tests, non-critical features = low
   - API changes, new features = medium
   - Database migrations, auth, security = high

5. Implementation Steps should:
   - Reference specific files from the codebase
   - Follow Commonwealth patterns (adapters, Zustand, feature flags, etc.)
   - Be actionable and specific
   - Include 3-8 steps typically

6. Testing Requirements should:
   - Specify exact test files to create/update
   - Match Commonwealth's testing patterns
   - Be realistic (don't require tests for trivial changes)

7. Packages should list actual Commonwealth packages:
   - @hicommonwealth/commonwealth
   - @hicommonwealth/model
   - @hicommonwealth/core
   - @hicommonwealth/adapters
   - @hicommonwealth/schemas
   - @hicommonwealth/shared
   - etc.

Output ONLY the issue content in the template format above. Do not include any preamble or explanation.
" > "$TEMP_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to generate issue${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Show the generated issue
echo -e "${GREEN}Generated Issue:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "$TEMP_FILE"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Extract metadata from the generated issue
TYPE=$(grep "^\*\*Type:\*\*" "$TEMP_FILE" | sed 's/^\*\*Type:\*\* //' | awk '{print $1}')
PRIORITY=$(grep "^\*\*Priority:\*\*" "$TEMP_FILE" | sed 's/^\*\*Priority:\*\* //' | awk '{print $1}')
RISK=$(grep "^\*\*Risk:\*\*" "$TEMP_FILE" | sed 's/^\*\*Risk:\*\* //' | awk '{print $1}')
CATEGORY=$(grep "^\*\*Category:\*\*" "$TEMP_FILE" | sed 's/^\*\*Category:\*\* //' | awk '{print $1}')

# Extract title from description (first line after ## Description)
TITLE=$(awk '/^## Description/{getline; print; exit}' "$TEMP_FILE" | sed 's/^\[//' | sed 's/\]$//')

echo -e "${YELLOW}Detected metadata:${NC}"
echo "  Title: $TITLE"
echo "  Type: $TYPE"
echo "  Priority: $PRIORITY"
echo "  Risk: $RISK"
echo "  Category: $CATEGORY"
echo ""

# Ask for confirmation
read -p "Create this GitHub issue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled. Issue content saved to: $TEMP_FILE${NC}"
    exit 0
fi

# Create labels string
LABELS="ai-ready,type:${TYPE},priority:${PRIORITY},risk:${RISK},area:${CATEGORY}"

# Create the issue
echo -e "${YELLOW}Creating GitHub issue...${NC}"
ISSUE_URL=$(gh issue create \
    --title "$TITLE" \
    --body-file "$TEMP_FILE" \
    --label "$LABELS" 2>&1)

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Issue created successfully!${NC}"
    echo ""
    echo -e "${BLUE}Issue URL:${NC} $ISSUE_URL"

    # Extract issue number
    ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')

    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "  1. Review the issue: gh issue view $ISSUE_NUM"
    echo "  2. Run the AI workflow: ./ai/run.sh $ISSUE_NUM"
    echo ""
else
    echo -e "${RED}✗ Failed to create issue${NC}"
    echo -e "${YELLOW}Issue content saved to: $TEMP_FILE${NC}"
    exit 1
fi

# Clean up
rm -f "$TEMP_FILE"
