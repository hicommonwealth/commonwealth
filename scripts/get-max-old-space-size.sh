#!/bin/bash

# This file can be used to determine the proper max_old_space_size for a
# Heroku dyno. If the total ram is available then use 70% of it otherwise use
# the node default of 4GB

# retrieves a Heroku dyno's total ram
# https://help.heroku.com/TWBM7DL0/how-do-i-measure-current-memory-use-and-max-available-memory-on-a-dyno-in-a-private-space
MEMORY_LIMIT=$(echo -n "$(</sys/fs/cgroup/memory/memory.limit_in_bytes)")

# if ram can be retrieved and it is greater than 400MB then return 70% of it
# the -gt check ensures that the max_old_space_size will never be set to a tiny value if the method of retrieving
# the total ram breaks
if [ "$MEMORY_LIMIT" ] && [ "$MEMORY_LIMIT" -gt 400000000 ]; then
  # set to 70% of total ram on the dyno
  echo $((MEMORY_LIMIT*70/100/1000000));
else
  # default to 4GB
  echo 4096;
fi

