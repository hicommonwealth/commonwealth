"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
const types_1 = require("../types");
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
    const [member, bridge] = addresses;
    const signer = provider.getSigner(member);
    // Deploy timelock
    const timelockFactory = new types_1.TimelockMock__factory(signer);
    const timelock = await timelockFactory.deploy(member, 2 * 60);
    // Deploy comp
    const compFactory = new types_1.MPond__factory(signer);
    const comp = await compFactory.deploy(member, bridge);
    // Deploy Delegate
    const delegateFactory = new types_1.GovernorBravoImmutable__factory(signer);
    const bravo = await delegateFactory.deploy(timelock.address, comp.address, member, 4, // 4 blocks voting period
    1, // 1 block voting delay
    1 // 1 vote proposal threshold
    );
    await bravo._initiate();
    console.log(bravo.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
