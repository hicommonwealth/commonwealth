
import { UserOperationBuilder } from 'userop';
import Web3 from 'web3';

export class DelegationAccount extends UserOperationBuilder{
    private provider: Web3

    constructor(provider: Web3){
        super()
        provider = provider;
        this.useMiddleware(this.fetchGasPrice)
        this.useMiddleware(this.signUserOperation);
    }

    async signUserOperation(ctx) {
        const requestId = ctx.getRequestId()
        ctx.op.signature = (await this.provider.eth.sign(requestId, (await this.provider.eth.getAccounts())[0]));
    };

    //TODO: build out
    async fetchGasPrice(ctx){
        // Fetch the latest gas prices.
        ctx.op.maxFeePerGas = "";
        ctx.op.maxPriorityFeePerGas = "";
        ctx.op.preVerificationGas = "";
        ctx.op.verificationGasLimit = "";
        ctx.op.callGasLimit = "";
    };

    execute(to: string, value: string, data: string, senderWallet: string) {
        this.setCallData(
            this.provider.eth.abi.encodeFunctionCall({
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "dest",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "func",
                        "type": "bytes"
                    }
                ],
                "name": "execute",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },  [to, value, data])
        );
        this.setSender(senderWallet);
        this.setNonce("GetFromEntrypoit for sender")
      }
    
}