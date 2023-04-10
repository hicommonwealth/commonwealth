#!/bin/bash

# This script is like a health check. It waits for the server to start on the specified port before returning.

attempt_counter=0
max_attempts=20

until $(curl --output /dev/null --silent --head --fail http://localhost:${PORT}); do
    if [ ${attempt_counter} -eq ${max_attempts} ];then
      echo "Max attempts reached"
      exit 1
    fi

    printf '.'
    attempt_counter=$(($attempt_counter+1))
    sleep 5
done

echo "Wait-sever script connected successfully"