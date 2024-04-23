import { IAaveGovernanceV2__factory } from '@hicommonwealth/chains';
import { ContractType } from '@hicommonwealth/shared';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import type ChainInfo from '../../../../models/ChainInfo';
import EthereumChain from '../chain';
import AaveApi from './api';

// Thin wrapper over EthereumChain to guarantee the `init()` implementation
// on the Governance module works as expected.
export default class AaveChain extends EthereumChain {
  public aaveApi: AaveApi;

  public coins(n: number, inDollars?: boolean) {
    return new EthereumCoin(
      this.app?.chain?.meta.default_symbol || '???',
      n,
      inDollars,
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
      this.api.currentProvider as any,
    );
    await this.aaveApi.init();
  }

  public deinit() {
    super.deinitMetadata();
    super.deinitEventLoop();
    super.deinitApi();
  }
}
