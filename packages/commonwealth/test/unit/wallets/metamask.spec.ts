import MetamaskWebWalletController from "../../../client/scripts/controllers/app/webWallets/metamask_web_wallet";
import { ethers } from "ethers";
import { getMetaMaskMock } from "../../util/mockMetaMaskUtil";

const window = {ethereum: getMetaMaskMock('https://mainnet.infura.io/v3/17253b2fd784479abff55a32c9b3282c', ethers.Wallet.createRandom().privateKey)};

describe('metamask_web_wallet', () => {
    it('metamask web wallet should get block', async () => {
        const mmww = new MetamaskWebWalletController()
        await mmww.enable()
        console.log(await mmww.getRecentBlock('1'))
    })
})