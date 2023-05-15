# The base branch is provided by GitHub Actions. If it's not set, default to "master".
BASE_BRANCH=${GITHUB_BASE_REF:-master}

# Fetch the base branch
git fetch origin $BASE_BRANCH

# Get a list of changed .ts files
LINES=$(git diff origin/$BASE_BRANCH...HEAD --name-only --diff-filter=d | grep \\.ts)

if [ -z "$LINES" ]
then
    echo "There is nothing to lint"
else
    echo $LINES
    NODE_OPTIONS="--max-old-space-size=4096" eslint $LINES
fi
