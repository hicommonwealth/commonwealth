#!/bin/sh
# After install, remove node modules associated with client build, to save space

# used as part of build
rm -rf node_modules/webpack
rm -rf node_modules/@babel
rm -rf node_modules/css-minimizer-webpack-plugin

# used on client only
rm -rf node_modules/@terra-money
rm -rf node_modules/@walletconnect

# used during solidity gen
rm -rf node_modules/hardhat
rm -rf node_modules/solc
rm -rf node_modules/ts-generator