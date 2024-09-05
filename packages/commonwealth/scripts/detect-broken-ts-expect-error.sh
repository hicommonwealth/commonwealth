#!/bin/bash

###
#
# In order to migrate enable StrictNullChecks we had to grandfather in a bunch
# of older code using @ts-expect-error. However, it works with ANY error so if
# we cause another error, other than null issues, it will hide the error.  This
# means we could cause a regression in our code.
#
# This will remove the StrictNullChecks logic and then run the build like it
# normally does.

set -e

# fix the main .ts files
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/\/\/ @ts-expect-error .*//g' '{}' ';'

# the tsx files have a slightly different syntax for JSX
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/{\/\* @ts-expect-error .*//g' '{}' ';'

# now turn off StrictNullChecks
sed -i 's/"strictNullChecks": true/"strictNullChecks": false/g' tsconfig.json

pnpm run build
