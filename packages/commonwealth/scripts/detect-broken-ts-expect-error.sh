#!/bin/bash

###
#
# In order to
#

set -e

# fix the main .ts files
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\/\/ @ts-expect-error .*//g' '{}' ';'

# the tsx files have a slightly different syntax for JSX
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/{\/\* @ts-expect-error .*//g' '{}' ';'

# now turn off StrictNullChecks
sed -i '' 's/"strictNullChecks": true/"strictNullChecks": false/g' tsconfig.json

pnpm run build
