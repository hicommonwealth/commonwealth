#!/bin/bash

# Must be run with:
# chmod +rx ./scripts/install-docker.sh && VULTR_IP=XXXXXXXXX ./scripts/install-docker.sh

# check that all required ENV var were properly loaded into the environment
if [[ -z "$VULTR_IP" ]]; then
    echo "Must provide VULTR_IP in .env" 1>&2
    exit 1
fi

echo "Connecting to root@$VULTR_IP"
# connect to the Vultr server on which the images will be loaded
ssh root@"$VULTR_IP" /bin/bash << "EOF"
echo "Connection Successful!"
lsb_release -a

# clear any existing docker version
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done

# Update/setup repositories
# Update the apt package index and install packages to allow apt to use a repository over HTTPS
apt-get -y update
apt-get -y install ca-certificates curl gnupg lsb-release

# Add Docker’s official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# setup repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# if this causes issues run:
# sudo chmod a+r /etc/apt/keyrings/docker.gpg
apt-get -y update

DOCKER_VERSION=$(apt-cache madison docker-ce | head -n 1 | cut -d " " -f 4)
echo "Installing Docker version: $DOCKER_VERSION"

apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# test the installation
docker run hello-world

# post-installation setup to avoid having to sudo for everything when signed in as the user
groupadd docker
usermod -aG docker $USER
newgrp docker

# configure docker to start on server startup
systemctl enable docker.service
systemctl enable containerd.service

# install other script dependencies
apt-get install -y net-tools lsof

EOF
