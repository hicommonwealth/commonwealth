import {
  QueryClient,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Bech32 } from '@cosmjs/encoding';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { BalanceType } from 'common-common/src/types';

import { BalanceProvider, IChainNode } from "../types";

export default class CosmosBalanceProvider extends BalanceProvider {
  public name = 'cosmos';
  public opts = {};
  public validBases = [BalanceType.Cosmos];

  public async getBalance(node: IChainNode, address: string): Promise<string> {
    // re-encode address if necessary
    if (!node.bech32) {
      throw new Error('No cosmos prefix found!');
    }
    const { data } = Bech32.decode(address);
    const encodedAddress = Bech32.encode(node.bech32, data);

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
      const bal = await api.bank.balance(encodedAddress, denom);
      return bal.amount;
    } catch (e) {
      throw new Error(`no balance found: ${e.message}`);
    }
  }
}