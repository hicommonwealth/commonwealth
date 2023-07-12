#!/bin/bash


# this path is relative to the location from which the script is called i.e. /chain-events root rather than the path
# from which the script exists i.e. chain-events/scripts/
. ../../scripts/load-env-var.sh --source-only

load-env-var '.env';



psql -h localhost -d postgres -U commonwealth -c 'DROP DATABASE commonwealth_chain_events WITH (FORCE);' && npx sequelize db:create
