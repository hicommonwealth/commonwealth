import EthereumChain from '../chain';
import YearnAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class YearnChain extends EthereumChain {
  public yearnAPI: YearnAPI;
}
