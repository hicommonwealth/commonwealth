truffle compile &&
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts 'contractbase/eth/build/contracts/ERC*.json'
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts/molochv2 'contractbase/eth/build/contracts/Moloch2.json'
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts/molochv2 'contractbase/eth/build/contracts/GuildBank2.json'
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts/molochv1 'contractbase/eth/build/contracts/Moloch1.json'
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts/molochv1 'contractbase/eth/build/contracts/GuildBank1.json'