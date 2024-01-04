import { fromBech32, toBech32 } from '@cosmjs/encoding';
import type { BankExtension, StakingExtension } from '@cosmjs/stargate';
import {
  QueryClient,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { BalanceType } from '@hicommonwealth/core';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';

export default class CosmosBalanceProvider extends BalanceProvider<
  QueryClient & BankExtension & StakingExtension
> {
  public name = 'cosmos';
  public opts = {};
  public validBases = [BalanceType.Cosmos];

  public async getExternalProvider(
    node: IChainNode,
  ): Promise<QueryClient & BankExtension & StakingExtension> {
    /* also do network === ChainNetwork.NativeCosmos / Terra or ChainNetwork.CosmosNFT => should check NFTs */
    const tmClient = await Tendermint34Client.connect(
      node.private_url || node.url,
    );

    const api = QueryClient.withExtensions(
      tmClient,
      setupBankExtension,
      setupStakingExtension,
    );
    return api;
  }

  public async getBalance(node: IChainNode, address: string): Promise<string> {
    // re-encode address if necessary
    if (!node.bech32) {
      throw new Error('No cosmos prefix found!');
    }
    const { data } = fromBech32(address);
    const encodedAddress = toBech32(node.bech32, data);

    const api = await this.getExternalProvider(node);

    try {
      const { params } = await api.staking.params();
      const denom = params?.bondDenom;
      if (!denom) {
        throw new Error('Could not query staking params');
      }
      // TODO: include staking balance alongside bank balance?
      const bal = await api.bank.balance(encodedAddress, denom);
      return bal.amount;
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }
}
