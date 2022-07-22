import { ChainInfo, NodeInfo } from 'models';
import { IAaveGovernanceV2__factory } from 'common-common/src/eth/types';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import EthereumChain from '../chain';
import AaveApi from './api';
import { attachSigner } from '../contractApi';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class AaveChain extends EthereumChain {
  public aaveApi: AaveApi;

  public coins(n: number, inDollars?: boolean) {
    return new EthereumCoin(this.app?.chain?.meta.symbol || '???', n, inDollars);
  }

  public async init(selectedChain: ChainInfo) {
    await super.resetApi(selectedChain);
    await super.initMetadata();
    this.aaveApi = new AaveApi(
      IAaveGovernanceV2__factory.connect,
      selectedChain.address,
      this.api.currentProvider as any
    );
    await this.aaveApi.init();
  }

  public deinit() {
    super.deinitMetadata();
    super.deinitEventLoop();
    super.deinitApi();
  }

  public async setDelegate(delegatee: string) {
    const token = this.aaveApi?.Token;
    if (!token) throw new Error('No token contract found');
    const contract = await attachSigner(this.app.wallets, this.app.user.activeAccount, token);
    await contract.delegate(delegatee);
  }

  public async getDelegate(delegator: string, type: 'voting' | 'proposition') {
    const token = this.aaveApi?.Token;
    if (!token) throw new Error('No token contract found');
    const delegate = await token.getDelegateeByType(delegator, type === 'voting' ? 0 : 1);
    return delegate;
  }
}
