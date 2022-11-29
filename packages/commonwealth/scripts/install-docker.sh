#!/bin/bash

# Must be run with:
# chmod +rx ./scripts/install-docker.sh && VULTR_IP=XXXXXXXXX ./scripts/install-docker.sh

# load environment variables from a local .env file
# https://stackoverflow.com/questions/19331497/set-environment-variables-from-file-of-key-value-pairs/30969768#30969768
# the -e option may need to be -E on Mac OS
# shellcheck disable=SC2046
if [[ $OSTYPE == 'darwin'* ]]; then
  export $(grep -v '^#' .env | xargs)
  else
    export $(grep -v '^#' .env | xargs -d '\n' -e)
fi

# check that all required ENV var were properly loaded into the environment
if [[ -z "$VULTR_IP" ]]; then
    echo "Must provide VULTR_IP in .env" 1>&2
    exit 1
    elif [[ -z "$VULTR_USER" ]]; then
      echo "Must provide VULTR_USER in .env" 1>&2
      exit 1
fi

echo "Connecting to root@$VULTR_IP"
# connect to the Vultr server on which the images will be loaded
ssh root@"$VULTR_IP" VULTR_USER="$VULTR_USER" /bin/bash << "EOF"
echo "Connection Successful!"
lsb_release -a

# clear any existing docker version
apt-get -y remove docker docker-engine docker.io containerd runc

# Update/setup repositories
# Update the apt package index and install packages to allow apt to use a repository over HTTPS
apt-get -y update
apt-get -y install ca-certificates curl gnupg lsb-release

# Add Docker’s official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# setup repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# if this causes issues run:
# sudo chmod a+r /etc/apt/keyrings/docker.gpg
apt-get -y update

DOCKER_VERSION=$(apt-cache madison docker-ce | head -n 1 | cut -d " " -f 4)
echo "Installing Docker version: $DOCKER_VERSION"

apt-get -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
apt-get -y install docker-ce="$DOCKER_VERSION" docker-ce-cli="$DOCKER_VERSION" containerd.io docker-compose-plugin

# test the installation
docker run hello-world

# post-installation setup to avoid having to sudo for everything when signed in as the user
groupadd docker
usermod -aG docker $VULTR_USER
newgrp docker

# configure docker to start on server startup
systemctl enable docker.service
systemctl enable containerd.service

# install other script dependencies
apt-get install -y net-tools lsof

EOF
