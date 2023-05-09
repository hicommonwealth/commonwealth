import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { IAaveGovernanceV2__factory } from 'common-common/src/eth/types';
import { ContractType } from 'common-common/src/types';
import type ChainInfo from '../../../../models/ChainInfo';
import EthereumChain from '../chain';
import { attachSigner } from '../contractApi';
import AaveApi from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class AaveChain extends EthereumChain {
  public aaveApi: AaveApi;

  public coins(n: number, inDollars?: boolean) {
    return new EthereumCoin(
      this.app?.chain?.meta.default_symbol || '???',
      n,
      inDollars
    );
  }

  public async init(selectedChain: ChainInfo) {
    await super.resetApi(selectedChain);
    await super.initMetadata();
    // iterate through selectedChain.Contracts for the Aave type and return the address
    const aaveContracts = this.app.contracts.getByType(ContractType.AAVE);
    if (!aaveContracts || !aaveContracts.length) {
      throw new Error('No Aave contracts found');
    }
    const aaveContract = aaveContracts[0];
    this.aaveApi = new AaveApi(
      IAaveGovernanceV2__factory.connect,
      aaveContract.address,
      this.api.currentProvider as any
    );
    await this.aaveApi.init();
  }

  public deinit() {
    super.deinitMetadata();
    super.deinitEventLoop();
    super.deinitApi();
  }

  public async setDelegate(delegatee: string) {
    const token = this.aaveApi?.Token;
    if (!token) throw new Error('No token contract found');
    const contract = await attachSigner(
      this.app.wallets,
      this.app.user.activeAccount,
      token
    );
    await contract.delegate(delegatee);
  }

  public async getDelegate(delegator: string, type: 'voting' | 'proposition') {
    const token = this.aaveApi?.Token;
    if (!token) throw new Error('No token contract found');
    const delegate = await token.getDelegateeByType(
      delegator,
      type === 'voting' ? 0 : 1
    );
    return delegate;
  }
}
