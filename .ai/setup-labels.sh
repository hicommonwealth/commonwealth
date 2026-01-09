#!/bin/bash
# Setup GitHub labels for AI workflow
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Setting up GitHub labels for AI workflow...${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

# Create AI workflow labels
echo "Creating AI workflow labels..."
gh label create "ai-ready" --color "0E8A16" --description "Ready for AI implementation" --force
gh label create "ai-in-progress" --color "FFA500" --description "AI is currently working on this" --force
gh label create "ai-completed" --color "1D76DB" --description "AI finished, needs human review" --force
gh label create "ai-blocked" --color "D93F0B" --description "AI couldn't complete, needs human help" --force

echo "Creating priority labels..."
gh label create "priority:critical" --color "B60205" --description "Critical priority" --force
gh label create "priority:high" --color "D93F0B" --description "High priority" --force
gh label create "priority:medium" --color "FBCA04" --description "Medium priority" --force
gh label create "priority:low" --color "0E8A16" --description "Low priority" --force

echo "Creating risk labels..."
gh label create "risk:low" --color "C2E0C6" --description "Low risk - safe for AI" --force
gh label create "risk:medium" --color "FEF2C0" --description "Medium risk - review carefully" --force
gh label create "risk:high" --color "F9D0C4" --description "High risk - needs extra scrutiny" --force

echo "Creating type labels (for branch naming)..."
gh label create "type:feature" --color "1D76DB" --description "New feature (creates feature/* branch)" --force
gh label create "type:fix" --color "D73A4A" --description "Bug fix (creates fix/* branch)" --force
gh label create "type:refactor" --color "5319E7" --description "Code refactoring (creates refactor/* branch)" --force
gh label create "type:chore" --color "FEF2C0" --description "Chores/maintenance (creates chore/* branch)" --force
gh label create "type:docs" --color "0075CA" --description "Documentation (creates docs/* branch)" --force
gh label create "type:test" --color "D4C5F9" --description "Testing (creates test/* branch)" --force

echo "Creating area labels..."
gh label create "area:ui" --color "1D76DB" --description "Frontend/UI changes" --force
gh label create "area:api" --color "0052CC" --description "API/backend changes" --force
gh label create "area:database" --color "5319E7" --description "Database/model changes" --force
gh label create "area:workers" --color "C5DEF5" --description "Worker/background job changes" --force
gh label create "area:shared" --color "BFD4F2" --description "Shared libraries" --force
gh label create "area:testing" --color "D4C5F9" --description "Testing infrastructure" --force
gh label create "area:infra" --color "0E8A16" --description "Infrastructure/DevOps" --force

echo ""
echo -e "${GREEN}✓ All labels created successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Create a GitHub issue using the AI-Assisted Task template"
echo "  2. Add the 'ai-ready' label to the issue"
echo "  3. Run: ./ai/run.sh <issue-number>"
echo "     or: ./ai/run.sh --auto"
