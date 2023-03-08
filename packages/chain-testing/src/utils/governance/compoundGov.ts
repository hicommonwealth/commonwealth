import { comp_gov, erc20 } from "../contracts";
import getProvider from "../getProvider";
import { IGovernor } from "./IGovernor";

export class compoundGovernor implements IGovernor  {
    readonly contractAddress = "0xc0Da02939E1441F497fd74F78cE7Decb17B66529"

    public async createArbitraryProposal(): Promise<string> {
        const provider = getProvider();
        const contract = comp_gov(this.contractAddress, provider);
        const account = (await provider.eth.getAccounts())[0]
        const compToken = erc20("0xc00e94Cb662C3520282E6f5717214004A7f26888", provider)
        await compToken.methods.delegate(account).send({from: account, gasLimit: 100000})
        const proposalId = await contract.methods
        .propose(
            ["0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3","0x316f9708bB98af7dA9c68C1C3b5e79039cD336E3"],
            [0,0],
            ["",""],
            [ "0xecb9a875000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc3000000000000000000000000c00e94cb662c3520282e6f5717214004a7f268880000000000000000000000000000000000000000000000000b84c09a3b930000",
                "0xecb9a875000000000000000000000000c3d688b66703497daa19211eedff47f25384cdc30000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c5990000000000000000000000000000000000000000000000000ce80612991d0000"
            ],
            "Liquidation ratio propoasl"
        ).send({from: account, gasLimit: 1000000})
        return proposalId
    }
}