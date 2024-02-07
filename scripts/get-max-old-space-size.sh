#!/bin/bash

# This file can be used to determine the proper max_old_space_size for a
# Heroku dyno. If the total ram is available then use 75% of it otherwise use
# the node default of 4GB. If the script throws an error at any point it will return a default of 1.5 GB

{
  # retrieves a Heroku dyno's total ram
  # https://help.heroku.com/TWBM7DL0/how-do-i-measure-current-memory-use-and-max-available-memory-on-a-dyno-in-a-private-space
  MEMORY_LIMIT=$(echo -n "$(</sys/fs/cgroup/memory/memory.limit_in_bytes)")

  ######## parsing the multiplier - this section will always yield a MULTIPLIER set to 1 or a decimal number ##########
  # if the multiplier is not given set multiplier to 1 (no effect)
  if ! [ "$1" ]; then
    MULTIPLIER=1
  # if the multiplier is given but it is not a number (integer or decimal) then set multiplier to 1 (no effect)
  elif [ "$1" ] && ! [[ $1 =~ ^[0-9]+$ ]] && ! [[ $1 =~ ^[0-9]*\.?[0-9]+$ ]]; then
     MULTIPLIER=1
  # if the multiplier is given and it is a number the use it
  else
    MULTIPLIER=$1
  fi

  DEFAULT_PERCENT=80

  # if ram can be retrieved and it is greater than 400MB then return 70% of it
  # the -gt check ensures that the max_old_space_size will never be set to a tiny value if the method of retrieving
  # the total ram breaks
  if [ "$MEMORY_LIMIT" ] && [ "$MEMORY_LIMIT" -gt 400000000 ]; then
    # rounds the MAX_OLD_SPACE_SIZE
    MAX_OLD_SPACE_SIZE=$(awk "BEGIN {print int($MULTIPLIER*$MEMORY_LIMIT*$DEFAULT_PERCENT/100000000); exit}")

    # this if-else section ensures that the money multiplier does not increase memory beyond 95% of what is available
    # or decrease under 400MB
    if [ $MAX_OLD_SPACE_SIZE -gt $(awk "BEGIN {printf \"%.0f\", $MEMORY_LIMIT*0.95; exit}") ] || [ $MAX_OLD_SPACE_SIZE -lt 400 ]; then
      # default to 70%
      echo $(($MEMORY_LIMIT*$DEFAULT_PERCENT/100000000))
    else
      # set to [70*MULTIPLIER]% of total ram on the dyno
      echo $MAX_OLD_SPACE_SIZE
    fi
  else
    MAX_OLD_SPACE_SIZE=$(awk "BEGIN {print int($MULTIPLIER*4096); exit}")
    if [ "$MAX_OLD_SPACE_SIZE" -gt 10000 ] || [ "$MAX_OLD_SPACE_SIZE" -lt 400 ]; then
      # default to 4GB on local development
      echo 4090
    else
      echo $MAX_OLD_SPACE_SIZE
    fi
  fi
} || {
  echo 1500;
}

