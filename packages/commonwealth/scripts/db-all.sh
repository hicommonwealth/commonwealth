#!/bin/bash

dumpName=${1:-latest.dump}

pnpm reset-db && pnpm load-db $dumpName && pnpm migrate-db