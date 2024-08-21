#!/bin/bash

###
#
# In order to
#

set -e

# find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\/\/ @ts-expect-error .*//g' '{}' ';'

find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/\* @ts-expect-error .*//g' '{}' ';'
