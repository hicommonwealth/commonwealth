import * as solw3 from '@solana/web3.js';

import { BalanceProvider, IChainNode } from "../types";

export default class SplTokenBalanceProvider implements BalanceProvider {
  public name = 'spl-token';
  public opts = {
    mint: 'string',
  };

  public async getBalance(node: IChainNode, address: string, opts: { mint: string }): Promise<string> {
    const url = solw3.clusterApiUrl(node.url as solw3.Cluster);
    const connection = new solw3.Connection(url);
    const mintPubKey = new solw3.PublicKey(opts.mint);
    const userPubKey = new solw3.PublicKey(address);
    const { value } = await connection.getParsedTokenAccountsByOwner(
      userPubKey,
      { mint: mintPubKey },
    );
    const amount: string = value[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
    return amount;
  }
}
