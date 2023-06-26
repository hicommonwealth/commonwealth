#!/bin/bash
# TODO: This will make the build fail (for MVP may not be ideal)
set -e

echo $0: Setting up the heroku-tunnel

# Check if required variables are set
echo $0: Checking for required env var
if [[ -z "${HEROKU_TUNNEL_PRIVATE_KEY}" || -z "${HEROKU_TUNNEL_IP}" || -z "${HEROKU_TUNNEL_PORT}" || -z "${HEROKU_TUNNEL_USER}" ]]; then
    echo "Required environment variable is not set, exiting."
    # TODO: This will make the build fail (for MVP may not be ideal)
    exit 1
fi

# Create the .ssh directory
echo $0: Creating the .ssh folder if it does not already exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create the private key file from the environment variable
echo $0: Creating the private key file from the env var
echo "${HEROKU_TUNNEL_PRIVATE_KEY}" > ~/.ssh/heroku-tunnel
chmod 600 ~/.ssh/heroku-tunnel

# Fetch the RSA public key of the remote server and append to known_hosts
echo $0: Scanning for known hosts
ssh-keyscan -t rsa "${HEROKU_TUNNEL_IP}" >> ~/.ssh/known_hosts

# Check if ssh-keyscan was successful
if [ $? -ne 0 ]; then
    echo "ssh-keyscan failed, exiting."
    # TODO: This will make the build fail (for MVP may not be ideal)
    exit 1
fi

# Start the SSH tunnel if not already running
SSH_CMD="autossh -f -N -L ${HEROKU_TUNNEL_PORT}:localhost:${HEROKU_TUNNEL_PORT} ${HEROKU_TUNNEL_USER}@${HEROKU_TUNNEL_IP} -i ~/.ssh/heroku-tunnel"

echo $0: Searching for existing tunnel
PID=`pgrep -f "${SSH_CMD}"`
if [ $PID ] ; then
    echo $0: tunnel already running on ${PID}
else
    echo $0 launching tunnel
    $SSH_CMD
    if [ $? -ne 0 ]; then
        echo "Failed to start SSH tunnel, exiting."
        # TODO: This will make the build fail (for MVP may not be ideal)
        exit 1
    fi
fi
