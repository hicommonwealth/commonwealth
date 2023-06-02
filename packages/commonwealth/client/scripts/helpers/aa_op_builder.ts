
import { UserOperationBuilder, Client } from 'userop';
import Web3 from 'web3';
import { BigNumberish } from "ethers"
import { OpToJSON } from 'userop/dist/utils';
import { JsonRpcProvider } from '@ethersproject/providers';
import { EntryPoint, EntryPoint__factory } from 'userop/dist/typechain';

const bundlerRPC = 'https://api.stackup.sh/v1/node/9fb29d028cc0f052af8136f1f9d68cf8a07db8ebf22869398dd82bc859eb703b';
const entrypointAddr = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
interface GasEstimate {
    preVerificationGas: BigNumberish;
    verificationGas: BigNumberish;
    callGasLimit: BigNumberish;
  }

class DelegationAccount extends UserOperationBuilder{
    private provider: Web3
    private bundlerProvider: JsonRpcProvider = new JsonRpcProvider(bundlerRPC);
    private entryPoint: EntryPoint;

    constructor(provider: Web3){
        super()
        this.provider = provider;
        this.entryPoint = EntryPoint__factory.connect(entrypointAddr, this.bundlerProvider)
        this.useMiddleware(this.resolveAccount);
        this.useMiddleware(this.fetchGasConfig);
        this.useMiddleware(this.signUserOperation);
    }

    async signUserOperation(ctx) {
        const requestId = ctx.getRequestId()
        ctx.op.signature = (await this.provider.eth.sign(requestId, (await this.provider.eth.getAccounts())[0]));
    };

    private resolveAccount = async (ctx) => {
        ctx.op.nonce = await this.entryPoint.getNonce(ctx.op.sender, 0);
        ctx.op.initCode = "0x";
      
    };

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
        const est = (await this.bundlerProvider.send("eth_estimateUserOperationGas", [
            OpToJSON(ctx.op),
            ctx.entryPoint,
          ])) as GasEstimate;
      
        ctx.op.preVerificationGas = est.preVerificationGas;
        ctx.op.verificationGasLimit = est.verificationGas;
        ctx.op.callGasLimit = est.callGasLimit;
    };

    public execute(to: string, value: string, data: string, senderWallet: string) {
        this.setSender(senderWallet);
        return this.setCallData(
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
      }
}

export const sendUserOp = async (signer: Web3, senderWallet: string, to: string, value: string, data: string) => {
    const delegationAccount = new DelegationAccount(signer);
    const client = await Client.init(bundlerRPC, entrypointAddr);

    const res = await client.sendUserOperation(
    delegationAccount.execute(to, value, data, senderWallet),
    { onBuild: (op) => console.log("Signed UserOperation:", op) }
    );
    console.log(`UserOpHash: ${res.userOpHash}`);

    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    return ev
}
