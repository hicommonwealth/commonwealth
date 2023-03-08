#!/bin/sh
# After install, remove node modules associated with client build, to save space

# used during testing / dev
rm -rfv ../../node_modules/tslint
rm -rfv ../../node_modules/stylelint
rm -rfv ../../node_modules/mocha
rm -rfv ../../node_modules/faker

# used on client only
# rm -rfv ../../node_modules/@terra-money
# rm -rfv ../../node_modules/@walletconnect

# used in scripts
rm -rfv ../../node_modules/sharp # compressImages

# used during solidity gen
rm -rfv ../../node_modules/hardhat
rm -rfv ../../node_modules/solc
rm -rfv ../../node_modules/ts-generator
rm -rfv ../../node_modules/@openzeppelin
rm -rfv ../../node_modules/@solidity-parser
rm -rfv ../../node_modules/@sentry
rm -rfv ../../node_modules/io-ts
rm -rfv ../../node_modules/fp-ts