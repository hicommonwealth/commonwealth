"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
require("@nomiclabs/hardhat-ethers");
const types_1 = require("../types");
async function increaseTime(blocks) {
    const timeToAdvance = blocks * 15;
    console.log(`Mining ${blocks} blocks and adding ${timeToAdvance} seconds!`);
    await hardhat_1.default.ethers.provider.send('evm_increaseTime', [timeToAdvance]);
    for (let i = 0; i < blocks; i++) {
        await hardhat_1.default.ethers.provider.send('evm_mine', []);
    }
}
async function initToken(token, member, amount) {
    await token.mint(member, amount);
    await token.delegate(member);
}
async function main() {
    const [signer] = await hardhat_1.default.ethers.getSigners();
    const member = signer.address;
    const TOTAL_SUPPLY = '1000000';
    // deploy and delegate tokens
    const tokenFactory = new types_1.AaveTokenV2Mock__factory(signer);
    const token1 = await tokenFactory.deploy();
    const token2 = await tokenFactory.deploy();
    // deploy strategy
    const strategyFactory = new types_1.GovernanceStrategy__factory(signer);
    const strategy = await strategyFactory.deploy(token1.address, token2.address);
    // deploy AaveGovernance without executor, so we can pass as admin to executor constructor
    const govFactory = new types_1.AaveGovernanceV2__factory(signer);
    const governance = await govFactory.deploy(strategy.address, 4, // 4 block voting delay
    member, []);
    // deploy Executor
    const executorFactory = new types_1.Executor__factory(signer);
    const executor = await executorFactory.deploy(governance.address, 60, // 1min delay
    60, // 1min grace period
    15, // 15s minimum delay
    120, // 2min maximum delay
    10, // 10% of supply required to submit
    12, // 12 blocks voting period
    10, // 10% differential required to pass
    20 // 20% quorum
    );
    // authorize executor on governance contract
    await governance.authorizeExecutors([executor.address]);
    // initialize tokens and test delegate events
    await initToken(token1, member, TOTAL_SUPPLY);
    await initToken(token2, member, TOTAL_SUPPLY);
    await increaseTime(1);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
