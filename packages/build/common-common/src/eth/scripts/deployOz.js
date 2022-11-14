"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
const types_1 = require("../types");
async function deployErc20VotesMock(signer, account, amount) {
    const factory = new types_1.ERC20VotesMock__factory(signer);
    const t = await factory.deploy('Test Token', 'TEST');
    await t.mint(account, amount);
    return t;
}
async function deployTimelock(signer, minDelay, proposers, executors) {
    const factory = new types_1.TimelockController__factory(signer);
    return factory.deploy(minDelay, proposers, executors);
}
async function main() {
    // TODO: configure URL based on chain
    const web3Provider = new web3_1.default.providers.WebsocketProvider('http://localhost:8545', {
        reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 10,
            onTimeout: true,
        },
    });
    const provider = new ethers_1.providers.Web3Provider(web3Provider);
    // 12s minute polling interval (default is 4s)
    provider.pollingInterval = 12000;
    const addresses = await provider.listAccounts();
    const [member] = addresses;
    const signer = provider.getSigner(member);
    // deploy voting token and mint 100 tokens
    const token = await deployErc20VotesMock(signer, member, 100);
    // deploy timelock
    const timelock = await deployTimelock(signer, 2 * 60, [member], [member]); // 2 min minutes delay
    // deploy governor
    const factory = new types_1.GovernorMock__factory(signer);
    const governor = await factory.deploy('Test Governor', token.address, 2, // 2 blocks delay until vote starts
    16, // vote goes for 16 blocks
    timelock.address, 5, // 5% of token supply must vote to pass = 5 tokens,
    0 // 0 votes required for a voter to become a proposer
    );
    // ensure governor can make calls on timelock by granting roles
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(PROPOSER_ROLE, governor.address);
    await timelock.grantRole(EXECUTOR_ROLE, governor.address);
    console.log(governor.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
