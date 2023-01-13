#!/bin/bash

# This file can be used to determine the proper max_old_space_size for a
# Heroku dyno. If the total ram is available then use 70% of it otherwise use
# the node default of 4GB

# retrieves a Heroku dyno's total ram
MEMORY_LIMIT=$(echo -n "$(</sys/fs/cgroup/memory/memory.limit_in_bytes)")

# MEMORY_LIMIT is only set on Heroku Dyno's
if [ "$MEMORY_LIMIT" ]; then
  # set to 70% of total ram on the dyno
  echo $($MEMORY_LIMIT*70/100/1000000);
else
  # default to 4GB
  echo 4096;
fi

