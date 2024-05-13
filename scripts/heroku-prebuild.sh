#! /bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

pnpm setup

source /app/.bashrc
pnpm add -g node-gyp

