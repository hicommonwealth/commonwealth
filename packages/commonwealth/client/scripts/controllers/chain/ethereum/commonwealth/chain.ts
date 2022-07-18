import EthereumChain from '../chain';
import CommonwealthAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class CommonwealthChain extends EthereumChain {
  public commonwealthApi: CommonwealthAPI;
}
