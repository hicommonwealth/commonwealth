# Check if the current commit is not a merge commit and not from precommit hook (To avoid infinite recursion)
if ! (git rev-parse -q --verify MERGE_HEAD > /dev/null || [[ -n "$PRE_COMMIT_RUNNING" ]]); then
  export PRE_COMMIT_RUNNING=1

  # Run Prettier on changed JavaScript/TypeScript files
  files=$(git diff --name-only master)

  for file in $files
  do
    npx prettier --write "$file"
    git add "$file"
  done

  if [[ $files ]]; then
    git commit
  fi

  unset PRE_COMMIT_RUNNING
fi
