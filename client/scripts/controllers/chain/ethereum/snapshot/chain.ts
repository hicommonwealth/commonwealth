import EthereumChain from '../chain';
import ContractApi from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class SnapshotTokenChain extends EthereumChain {
  public contractApi: ContractApi;
}
