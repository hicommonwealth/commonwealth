truffle compile &&
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contractWrappers 'build/contracts/ERC*.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contractWrappers/MolochV2 'build/contracts/Moloch2.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contractWrappers/MolochV2 'build/contracts/GuildBank2.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contractWrappers/MolochV1 'build/contracts/Moloch1.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contractWrappers/MolochV1 'build/contracts/GuildBank1.json'