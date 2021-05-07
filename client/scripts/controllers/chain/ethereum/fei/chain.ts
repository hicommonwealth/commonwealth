import EthereumChain from '../chain';
import FeiAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class FeiChain extends EthereumChain {
  public feiAPI: FeiAPI;
}
