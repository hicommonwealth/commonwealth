import { NodeInfo } from 'models';
import { AaveGovernanceV2__factory } from 'eth/types';
import EthereumChain from '../chain';
import AaveApi from './api';
import { attachSigner } from '../contractApi';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class AaveChain extends EthereumChain {
  public aaveApi: AaveApi;

  public async init(selectedNode: NodeInfo) {
    await super.resetApi(selectedNode);
    await super.initMetadata();
    this.aaveApi = new AaveApi(
      AaveGovernanceV2__factory.connect,
      selectedNode.address,
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
    const token = this.aaveApi.Token;
    const delegator = this.app.user.activeAccount.address;
    const contract = await attachSigner(this.app.wallets, delegator, token);
    await contract.delegate(delegatee);
  }

  public async getDelegate(delegator: string, type: 'voting' | 'proposition') {
    const token = this.aaveApi.Token;
    const delegate = await token.getDelegateeByType(delegator, type === 'voting' ? 0 : 1);
    return delegate;
  }
}
