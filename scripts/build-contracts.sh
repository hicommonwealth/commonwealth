cd contractbase/eth && truffle compile && cd ../..
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts 'contractbase/eth/build/contracts/ERC*.json'
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts 'contractbase/eth/build/contracts/Moloch.json'
./node_modules/typechain/dist/cli/cli.js --target=ethers --outDir client/scripts/controllers/chain/ethereum/contracts 'contractbase/eth/build/contracts/GuildBank.json'