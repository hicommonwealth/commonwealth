import { ethers } from "ethers";
export declare class BundlerJsonRpcProvider extends ethers.providers.JsonRpcProvider {
    private bundlerRpc?;
    private bundlerMethods;
    setBundlerRpc(bundlerRpc?: string): BundlerJsonRpcProvider;
    send(method: string, params: any[]): Promise<any>;
}
