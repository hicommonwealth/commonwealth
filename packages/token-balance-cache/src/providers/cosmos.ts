import {
  QueryClient,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';

import { BalanceProvider, IChainNode } from "../types";

export default class CosmosBalanceProvider implements BalanceProvider {
  public name = 'cosmos';
  public opts = {};

  public async getBalance(node: IChainNode, address: string): Promise<string> {
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
      const bal = await api.bank.balance(address, denom);
      return bal.amount;
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }
}