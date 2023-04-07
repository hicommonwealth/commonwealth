#!/bin/bash
# This script is used to start a local cosmos chain for testing purposes.

#set -x
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# if exists folder cosmos-sdk, skip next three lines
if [ ! -d $SCRIPT_DIR/cosmos-sdk ]; 
    then
        echo "cosmos-sdk folder does not exist, downloading cosmos-sdk"
        cd $SCRIPT_DIR
        wget -qO- https://github.com/cosmos/cosmos-sdk/archive/refs/tags/v0.46.12.tar.gz | tar -xz 
        mv $SCRIPT_DIR/cosmos-sdk-0.46.12 $SCRIPT_DIR/cosmos-sdk
    else
        echo "cosmos-sdk folder exists, skipping wget"
fi

if [ -d $SCRIPT_DIR/cosmos-sdk ]; 
    then
        cd $SCRIPT_DIR/cosmos-sdk
        cp $SCRIPT_DIR/bootstrap.sh $SCRIPT_DIR/cosmos-sdk
        cp $SCRIPT_DIR/docker-compose.yml $SCRIPT_DIR/cosmos-sdk
        docker-compose up -d
    else
        echo "cosmos-sdk folder does not exist,please download source, exiting"
fi