#!/usr/bin/env bash

set -e

function clean() {
    echo "Cleaning $1 ..."
    dirs=$(find . -type d -path "./$1/**/node_modules" -maxdepth 3)
    for dir in $dirs; do
        echo "$dir ..."
        rm -rf $dir
    done
}

clean "packages"
clean "libs"

echo "Cleaning root ..."
rm -rf "node_modules"
