import EthereumChain from '../chain';
import TokenAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class EthereumTokenChain extends EthereumChain {
  public tokenAPI: TokenAPI;
}
