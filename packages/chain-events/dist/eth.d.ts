import { providers } from 'ethers';
export declare function createProvider(ethNetworkUrl: string, network?: string, chain?: string): Promise<providers.Web3Provider>;
