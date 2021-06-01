import { AaveGovernanceV2, AaveGovernanceV2__factory, Executor } from 'eth/types';
import ContractApi from 'controllers/chain/ethereum/contractApi';

// TODO: currently we do not distinguish between short and long executor, but we should
//   support both contracts, in theory, in order to provide full support for the protocol.
//   This may require a DB change in order to store both addresses on the same chain.
export default class AaveApi extends ContractApi<Executor> {
  private _Executor: Executor;
  public get Executor() { return this._Executor; }

  private _Governance: AaveGovernanceV2;
  public get Governance() { return this._Governance; }

  public async init() {
    await super.init();
    this._Executor = this.Contract;

    // fetch governance from executor etc
    const governanceAddress = await this.Executor.getAdmin();
    this._Governance = AaveGovernanceV2__factory.connect(governanceAddress, this.Provider);
    await this._Governance.deployed();
  }
}
