#!/bin/sh
# Generates a visualization of module dependencies
madge -i out.png --exclude '^state\.ts$|^identifiers\.ts$|app\/notifications|(node_modules\/@types)|construct-ui|models\/|stores\/|shared\/adapters\/|helpers' client/scripts/app.tsx
