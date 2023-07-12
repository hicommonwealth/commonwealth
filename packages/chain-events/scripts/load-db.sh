#!/bin/bash


# this path is relative to the location from which the script is called i.e. /chain-events root rather than the path
# from which the script exists i.e. chain-events/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '.env';

DUMP_NAME=latest.dump
if [ "$1" ]; then
  DUMP_NAME=$1
fi

psql -h localhost -d commonwealth_chain_events -U commonwealth -f "$DUMP_NAME";
