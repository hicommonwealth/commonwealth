truffle compile &&
../node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir './types' './build/contracts/*.json'