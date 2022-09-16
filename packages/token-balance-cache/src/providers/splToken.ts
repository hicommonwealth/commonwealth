import BN from 'bn.js';
import * as solw3 from '@solana/web3.js';

import { BalanceProviderT, ChainNodeT } from '../types';

export type SplTokenOpts = {
  mint: string;
};

const BalanceProvider: BalanceProviderT<SplTokenOpts> = {
  name: 'eth-token',
  getCacheKey: (node: ChainNodeT, address: string, { mint }) => {
    return `${address}-${node.url as solw3.Cluster}-${mint}`;
  },
  getBalance: async (node: ChainNodeT, user: string, { mint }) => {
    const url = solw3.clusterApiUrl(node.url as solw3.Cluster);
    const connection = new solw3.Connection(url);
    const mintPubKey = new solw3.PublicKey(mint);
    const userPubKey = new solw3.PublicKey(user);
    const { value } = await connection.getParsedTokenAccountsByOwner(
      userPubKey,
      { mint: mintPubKey },
    );
    const amount: string = value[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
    return new BN(amount, 10);
  },
};

export default BalanceProvider;
