#!/bin/bash


# this path is relative to the location from which the script is called i.e. /chain-events root rather than the path
# from which the script exists i.e. chain-events/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '.env';

PGPASSWORD=$DB_PASSWORD psql -h localhost commonwealth_chain_events -U commonwealth
