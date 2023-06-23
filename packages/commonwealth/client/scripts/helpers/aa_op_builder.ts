
import { UserOperationBuilder, Client } from '../../../node_modules_perm/userop';
import Web3 from 'web3';
import { BigNumberish, ethers } from "ethers"
import { OpToJSON } from '../../../node_modules_perm/userop/dist/utils';
import { JsonRpcProvider } from '@ethersproject/providers';
import { EntryPoint, EntryPoint__factory } from '../../../node_modules_perm/userop/dist/typechain';

const bundlerRPC = 'https://api.stackup.sh/v1/node/9fb29d028cc0f052af8136f1f9d68cf8a07db8ebf22869398dd82bc859eb703b';
const entrypointAddr = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
const bundlerProvider: JsonRpcProvider = new JsonRpcProvider(bundlerRPC);
interface GasEstimate {
    preVerificationGas: BigNumberish;
    verificationGas: BigNumberish;
    callGasLimit: BigNumberish;
  }

class DelegationAccount extends UserOperationBuilder{
    private provider: Web3
    private ;
    private entryPoint: EntryPoint;

    constructor(provider: Web3){
        super()
        this.provider = provider;
        this.entryPoint = EntryPoint__factory.connect(entrypointAddr, bundlerProvider)
        this.useMiddleware(this.resolveAccount);
        this.useMiddleware(this.fetchGasConfig);
        this.useMiddleware(this.signUserOperation(provider));
    }

    signUserOperation =
    (signer: Web3) =>
    async (ctx) => {
        console.log(ctx.getUserOpHash())
        const hash = ctx.getUserOpHash()
        ctx.op.signature = (await signer.eth.sign(hash, (await signer.eth.getAccounts())[0]));
    };

    private resolveAccount = async (ctx) => {
        ctx.op.nonce = await this.entryPoint.getNonce(ctx.op.sender, 0);
        ctx.op.initCode = "0x";
      
    };

    async fetchGasConfig(ctx){
        // Fetch the latest gas prices.
        // Gas Prices
        const [fee, block] = await Promise.all([
            bundlerProvider.send('eth_maxPriorityFeePerGas', []),
            bundlerProvider.getBlock("latest"),
          ]);
        
        const tip = Web3.utils.toBN(fee);
        const buffer = tip.div(Web3.utils.toBN(100)).mul(Web3.utils.toBN(13));
        const maxPriorityFeePerGas = tip.add(buffer);
        
        ctx.op.maxFeePerGas = block.baseFeePerGas
        ? parseInt(Web3.utils.toBN(block.baseFeePerGas.toString()).mul(Web3.utils.toBN(2)).add(maxPriorityFeePerGas).toString())
        : parseInt(maxPriorityFeePerGas.toString());
        ctx.op.maxPriorityFeePerGas = parseInt(maxPriorityFeePerGas.toString());
        
        //Gas limits
        //TODO: this should be a bundler provider not w3
        ctx.op.signature = '0x5fcccb21aded062666e151e23c5fe20b2e0de3642d4821710bbb860f0acc90213c4c52ffdfed2df79f0376d9984441b783438f1406608de9a92786669ee0bc511b'
        const est = (await bundlerProvider.send("eth_estimateUserOperationGas", [
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
    const client = await Client.init(bundlerRPC);

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
