truffle compile &&
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contracts 'build/contracts/ERC*.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contracts/MolochV2 'build/contracts/Moloch2.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contracts/MolochV2 'build/contracts/GuildBank2.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contracts/MolochV1 'build/contracts/Moloch1.json'
./node_modules/typechain/dist/cli/cli.js --target=truffle-v5 --outDir contracts/MolochV1 'build/contracts/GuildBank1.json'