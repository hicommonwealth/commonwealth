import EthereumChain from '../chain';
import MolochAPI from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class MolochChain extends EthereumChain {
  public molochApi: MolochAPI;
}
