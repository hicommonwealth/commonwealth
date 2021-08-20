import EthereumChain from '../chain';
import CMNProjectAPI from './project/api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class CMNChain extends EthereumChain {
  public CMNProjectApi: CMNProjectAPI;
}
