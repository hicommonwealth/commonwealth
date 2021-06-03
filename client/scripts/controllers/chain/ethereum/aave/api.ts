import { AaveGovernanceV2, Executor__factory, Executor } from 'eth/types';
import ContractApi from 'controllers/chain/ethereum/contractApi';
export default class AaveApi extends ContractApi<AaveGovernanceV2> {
  private _Governance: AaveGovernanceV2;
  public get Governance() { return this._Governance; }

  private _Executors: Executor[];
  public get Executors() { return this._Executors; }

  public getExecutor(executorAddress: string) {
    return this.Executors.find((ex) => ex.address === executorAddress);
  }

  public async init() {
    await super.init();
    this._Governance = this.Contract;

    // fetch executors from governance via historical filter query
    const executorAuthFilter = this.Governance.filters.ExecutorAuthorized(null);
    const executors = await this.Governance.queryFilter(executorAuthFilter, 0);
    this._Executors = [];
    for (const executorAuthResult of executors) {
      const address = executorAuthResult.args[0];
      // since the historical query returns all executors ever authorized, we need to check
      // which haven't also been unauthorized later
      const isValid = await this.Governance.isExecutorAuthorized(address);
      if (isValid) {
        const executor = Executor__factory.connect(address, this.Contract.provider);
        await executor.deployed();
        this._Executors.push(executor);
      }
    }
  }
}
