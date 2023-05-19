
import { UserOperationBuilder } from 'userop';
import Web3 from 'web3';
import { BigNumberish } from "ethers"

interface GasEstimate {
    preVerificationGas: BigNumberish;
    verificationGas: BigNumberish;
    callGasLimit: BigNumberish;
  }

export class DelegationAccount extends UserOperationBuilder{
    private provider: Web3

    constructor(provider: Web3){
        super()
        provider = provider;
        this.useMiddleware(this.fetchGasConfig)
        this.useMiddleware(this.signUserOperation);
    }

    async signUserOperation(ctx) {
        const requestId = ctx.getRequestId()
        ctx.op.signature = (await this.provider.eth.sign(requestId, (await this.provider.eth.getAccounts())[0]));
    };

    //TODO: build out
    async fetchGasConfig(ctx){
        // Fetch the latest gas prices.
        // Gas Prices
        const [fee, block] = await Promise.all([
            this.provider.givenProvider.send(
            {
                jsonrpc: '2.0',
                method: 'eth_maxPriorityFeePerGas',
                params: [],
                id: 1
            }
            ),
            this.provider.givenProvider.send(
            {
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            }
            )
          ]);
        const tip = fee;
        const buffer = tip.div(100).mul(13);
        const maxPriorityFeePerGas = tip.add(buffer);
        
        ctx.op.maxFeePerGas = block.baseFeePerGas
        ? block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas)
        : maxPriorityFeePerGas;
        ctx.op.maxPriorityFeePerGas = maxPriorityFeePerGas;
        
        //Gas limits
        //TODO: this should be a bundler provider not w3
        const est = (await provider.send("eth_estimateUserOperationGas", [
            OpToJSON(ctx.op),
            ctx.entryPoint,
          ])) as GasEstimate;
      
        ctx.op.preVerificationGas = est.preVerificationGas;
        ctx.op.verificationGasLimit = est.verificationGas;
        ctx.op.callGasLimit = est.callGasLimit;
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