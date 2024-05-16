#!/bin/bash

dumpName=${1:-latest.dump}

yarn reset-db && yarn load-db $dumpName && yarn migrate-db