import EthereumChain from '../chain';
import AaveApi from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class AaveChain extends EthereumChain {
  public aaveApi: AaveApi;
}
