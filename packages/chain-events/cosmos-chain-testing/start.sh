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
        wget -qO- https://github.com/cosmos/cosmos-sdk/archive/refs/tags/v0.46.11.tar.gz | tar -xz 
        mv $SCRIPT_DIR/cosmos-sdk-0.46.11 $SCRIPT_DIR/cosmos-sdk
    else
        echo "cosmos-sdk folder exists, skipping wget"
fi

if [ -d $SCRIPT_DIR/cosmos-sdk ]; 
    then
        cd $SCRIPT_DIR/cosmos-sdk
        cp $SCRIPT_DIR/bootstrap.sh $SCRIPT_DIR/cosmos-sdk
        cp $SCRIPT_DIR/nginx.conf $SCRIPT_DIR/cosmos-sdk
        cp $SCRIPT_DIR/docker-compose.yml $SCRIPT_DIR/cosmos-sdk
    else
        echo "cosmos-sdk folder does not exist,please download source, exiting"
fi

# check if DEPLOY_ENV is set, and equal to heroku
if [ $DEPLOY_ENV = "heroku" ]; 
    then
        echo "DEPLOY_ENV is set to heroku, skipping docker-compose"
    else
        echo "DEPLOY_ENV is not set to heroku, running docker-compose"
        docker-compose up
fi