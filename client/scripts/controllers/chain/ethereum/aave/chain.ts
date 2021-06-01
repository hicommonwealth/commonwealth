import { NodeInfo } from 'models';
import { Executor__factory } from 'eth/types';
import EthereumChain from '../chain';
import AaveApi from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class AaveChain extends EthereumChain {
  public aaveApi: AaveApi;

  public async init(selectedNode: NodeInfo) {
    await super.resetApi(selectedNode);
    await super.initMetadata();
    this.aaveApi = new AaveApi(
      Executor__factory.connect,
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
}
