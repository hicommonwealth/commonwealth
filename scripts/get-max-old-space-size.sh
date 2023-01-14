#!/bin/bash

# This file can be used to determine the proper max_old_space_size for a
# Heroku dyno. If the total ram is available then use 70% of it otherwise use
# the node default of 4GB. If the script throws an error at any point it will return a default of 1.5 GB

{
  # retrieves a Heroku dyno's total ram
  # https://help.heroku.com/TWBM7DL0/how-do-i-measure-current-memory-use-and-max-available-memory-on-a-dyno-in-a-private-space
  MEMORY_LIMIT=$(echo -n "$(</sys/fs/cgroup/memory/memory.limit_in_bytes)")

  # if ram can be retrieved and it is greater than 400MB then return 70% of it
  # the -gt check ensures that the max_old_space_size will never be set to a tiny value if the method of retrieving
  # the total ram breaks
  if [ "$MEMORY_LIMIT" ] && [ "$MEMORY_LIMIT" -gt 400000000 ]; then
  re='^[0-9]+$'
  # if the multiplier is not given set multiplier to 1 (no effect)
  if ! [ "$1" ]; then
    MULTIPLIER=1;
  # if the multiplier is given but it is not a number then echo the default 1500
  elif [ "$1" ] && ! [[ $1 =~ $re ]] ; then
     echo 1500
  # if the multiplier is given and it is a number the use it
  else
    MULTIPLIER=$1
  fi

  # set to 70% of total ram on the dyno
  echo $((MEMORY_LIMIT*70*MULTIPLIER/100/1000000));
else
  # default to 4GB on local development
  echo 4096;
fi } || {
  echo 1500;
}

