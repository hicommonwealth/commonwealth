import EthereumChain from '../chain';
import MarlinAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class MarlinChain extends EthereumChain {
  public marlinApi: MarlinAPI;
}
