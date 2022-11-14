"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const ethers_1 = require("ethers");
async function increaseTime(provider, blocks) {
    const timeToAdvance = blocks * 15;
    console.log(`Mining ${blocks} blocks and adding ${timeToAdvance} seconds!`);
    await provider.send('evm_increaseTime', [timeToAdvance]);
    for (let i = 0; i < blocks; i++) {
        await provider.send('evm_mine', []);
    }
}
async function main(argv) {
    const web3Provider = new web3_1.default.providers.WebsocketProvider('ws://localhost:8545');
    const provider = new ethers_1.providers.Web3Provider(web3Provider);
    const nBlocks = argv[0] ? +argv[0] : 1;
    await increaseTime(provider, nBlocks);
    const block = await provider.getBlock('latest');
    console.log(`Current block number ${block.number} with timestamp ${block.timestamp}.`);
}
main(process.argv.slice(2))
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
