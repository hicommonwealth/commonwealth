truffle compile &&
../node_modules/typechain/dist/cli/cli.js --target=ethers-v4 --outDir './types' './build/contracts/*.json'