# The base branch is provided by GitHub Actions. If it's not set, default to "master".
BASE_BRANCH=${GITHUB_BASE_REF:-master}
echo "Base branch is $BASE_BRANCH"

# Fetch the base branch only if this script is running in GitHub Actions
# and the base branch hasn't been fetched yet
if [ -n "$GITHUB_BASE_REF" ]; then
    if ! git show-ref --quiet refs/remotes/origin/$BASE_BRANCH; then
        git fetch origin $BASE_BRANCH
    fi
fi

# Get a list of changed .ts files
LINES=$(git diff origin/$BASE_BRANCH...HEAD --name-only --diff-filter=d | grep \\.ts)

if [ -z "$LINES" ]
then
    echo "There is nothing to lint"
else
    echo $LINES
    NODE_OPTIONS="--max-old-space-size=4096" eslint $LINES
fi
