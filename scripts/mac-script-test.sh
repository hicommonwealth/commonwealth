#!/bin/bash

export $(grep -v '^#' .env | xargs -E)
printenv
