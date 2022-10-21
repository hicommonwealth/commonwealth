import * as solw3 from '@solana/web3.js';

import { BalanceProvider, IChainNode } from "../types";

type SplTokenBPOpts = {
  tokenAddress: string;
};

export default class SplTokenBalanceProvider implements BalanceProvider<SplTokenBPOpts> {
  public name = 'spl-token';
  public opts = {
    tokenAddress: 'string',
  };

  public getCacheKey(node: IChainNode, address: string, opts: SplTokenBPOpts): string {
    return `${address}-${node.url as solw3.Cluster}-${opts.tokenAddress}`;
  }

  public async getBalance(node: IChainNode, address: string, opts: SplTokenBPOpts): Promise<string> {
    const url = solw3.clusterApiUrl(node.url as solw3.Cluster);
    const connection = new solw3.Connection(url);
    const mintPubKey = new solw3.PublicKey(opts.tokenAddress);
    const userPubKey = new solw3.PublicKey(address);
    const { value } = await connection.getParsedTokenAccountsByOwner(
      userPubKey,
      { mint: mintPubKey },
    );
    const amount: string = value[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
    return amount;
  }
}
