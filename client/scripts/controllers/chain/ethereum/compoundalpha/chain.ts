import EthereumChain from '../chain';
import CompoundalphaAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class CompoundalphaChain extends EthereumChain {
  public compoundalphaApi: CompoundalphaAPI;
}
