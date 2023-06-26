#!/bin/bash

echo $0: Setting up the heroku-tunnel ssh private key

# Create the .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create the private key file from the environment variable
echo "${HEROKU_TUNNEL_PRIVATE_KEY}" > ~/.ssh/heroku-tunnel
chmod 600 ~/.ssh/heroku-tunnel

# Fetch the RSA public key of the remote server
ssh-keyscan -t rsa "${HEROKU_TUNNEL_IP}" > ~/.ssh/known_hosts

# Start the SSH tunnel if not already running
SSH_CMD="autossh -f -N -L ${HEROKU_TUNNEL_PORT}:localhost:${HEROKU_TUNNEL_PORT} ${HEROKU_TUNNEL_USER}@${HEROKU_TUNNEL_IP}"

PID=`pgrep -f "${SSH_CMD}"`
if [ $PID ] ; then
    echo $0: tunnel already running on ${PID}
else
    echo $0 launching tunnel
    $SSH_CMD
fi
