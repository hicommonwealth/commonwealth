# Run Prettier on changed JavaScript/TypeScript files
for file in $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$')
do
  prettier --write "$file"
  git add "$file"
done
