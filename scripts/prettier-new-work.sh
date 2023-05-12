# Check if the current commit is from precommit hook (To avoid infinite recursion)
if [[ -n "$PRE_COMMIT_RUNNING" ]]; then
  exit 0;
fi

export PRE_COMMIT_RUNNING=1

# Run Prettier on changed JavaScript/TypeScript files
files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$')

echo "$files"
for file in $files
do
  npx prettier --write "$file"
  git add "$file"
done

if [[ $files ]]; then
  git commit --amend --no-edit 2>/dev/null
fi

unset PRE_COMMIT_RUNNING
