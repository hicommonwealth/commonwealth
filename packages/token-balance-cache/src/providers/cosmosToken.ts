import BN from 'bn.js';

import {
  QueryClient,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';

import { BalanceProviderT, ChainNodeT } from '../types';

export type CosmosTokenOpts = {};

const BalanceProvider: BalanceProviderT<CosmosTokenOpts> = {
  name: 'cosmos-token',
  getCacheKey: (node: ChainNodeT, address: string) => {
    return `${node.id}-${address}`;
  },
  getBalance: async (node, userAddress) => {
    /* also do network === ChainNetwork.NativeCosmos / Terra or ChainNetwork.CosmosNFT => should check NFTs */
    const tmClient = await Tendermint34Client.connect(node.private_url || node.url);

    const api = QueryClient.withExtensions(
      tmClient,
      setupBankExtension,
      setupStakingExtension,
    );

    try {
      const { params } = await api.staking.params();
      const denom = params?.bondDenom;
      if (!denom) {
        throw new Error('Could not query staking params');
      }
      // TODO: include staking balance alongside bank balance?
      const bal = await api.bank.balance(userAddress, denom);
      return new BN(bal.amount);
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }
};

export default BalanceProvider;
