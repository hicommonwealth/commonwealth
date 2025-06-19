#!/bin/bash

branch="master" 
for file in $(git diff "$branch" --name-only -- 'libs/**/*.ts'); do
  if [[ -f "$file" ]]; then
    # Normalize content (replace zod/v4 → zod)
    git show "$branch:$file" 2>/dev/null | sed 's|zod/v4|zod|g' > /tmp/old.ts
    sed 's|zod/v4|zod|g' "$file" > /tmp/new.ts

    # Show diff if meaningful change remains
    if ! diff -q /tmp/old.ts /tmp/new.ts >/dev/null; then
      echo -e "\n--- $file ---"
      diff -u /tmp/old.ts /tmp/new.ts
    fi
  fi
done