import type {
  BankExtension,
  QueryClient,
  StakingExtension,
} from '@cosmjs/stargate';
import { BalanceType } from 'common-common/src/types';

import type { IChainNode } from '../types';
import { BalanceProvider } from '../types';

export default class CosmosBalanceProvider extends BalanceProvider<
  QueryClient & BankExtension & StakingExtension
> {
  public name = 'cosmos';
  public opts = {};
  public validBases = [BalanceType.Cosmos];

  public async getExternalProvider(
    node: IChainNode
  ): Promise<QueryClient & BankExtension & StakingExtension> {
    const cosmRpc = await import('@cosmjs/tendermint-rpc');
    /* also do network === ChainNetwork.NativeCosmos / Terra or ChainNetwork.CosmosNFT => should check NFTs */
    const tmClient = await cosmRpc.Tendermint34Client.connect(
      node.private_url || node.url
    );

    const cosm = await import('@cosmjs/stargate');
    const api = cosm.QueryClient.withExtensions(
      tmClient,
      cosm.setupBankExtension,
      cosm.setupStakingExtension
    );
    return api;
  }

  public async getBalance(node: IChainNode, address: string): Promise<string> {
    // re-encode address if necessary
    if (!node.bech32) {
      throw new Error('No cosmos prefix found!');
    }
    const cosmEnc = await import('@cosmjs/encoding');
    const { data } = cosmEnc.Bech32.decode(address);
    const encodedAddress = cosmEnc.Bech32.encode(node.bech32, data);

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
