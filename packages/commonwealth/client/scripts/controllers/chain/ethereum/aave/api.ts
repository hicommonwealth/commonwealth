import type {
  AaveTokenV2,
  Executor,
  IAaveGovernanceV2,
} from '@hicommonwealth/chains';
import { Executor__factory } from '@hicommonwealth/chains';
import ContractApi from 'controllers/chain/ethereum/contractApi';

export interface AaveExecutor {
  contract: Executor;
  address: string;
  delay: number;
}

export default class AaveApi extends ContractApi<IAaveGovernanceV2> {
  private _Governance: IAaveGovernanceV2;
  public get Governance() {
    return this._Governance;
  }

  private _Token: AaveTokenV2;
  public get Token() {
    return this._Token;
  }

  private _aaveExecutorsInitialized = false;
  private _Executors: AaveExecutor[];

  public async getAaveExecutors(): Promise<AaveExecutor[]> {
    if (this._aaveExecutorsInitialized) return this._Executors;

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
        const executor = Executor__factory.connect(
          address,
          this.Contract.provider,
        );
        await executor.deployed();

        const delay = +(await executor.getDelay());
        this._Executors.push({
          contract: executor,
          address: executor.address,
          delay,
        });

        if (!this.deployedExecutors[executor.address]) {
          this.deployedExecutors[executor.address] = executor;
        }
      }
    }

    this._aaveExecutorsInitialized = true;
    return this._Executors;
  }

  private deployedExecutors: { [address: string]: Executor } = {};
  public async getDeployedExecutor(executorAddress: string): Promise<Executor> {
    if (this.deployedExecutors[executorAddress]) {
      return this.deployedExecutors[executorAddress];
    } else {
      const isValid = await this.Governance.isExecutorAuthorized(
        executorAddress,
      );
      if (isValid) {
        const executor = Executor__factory.connect(
          executorAddress,
          this.Contract.provider,
        );
        const deployedExecutor = await executor.deployed();
        this.deployedExecutors[executorAddress] = deployedExecutor;
        return deployedExecutor;
      } else {
        console.error('Executor is not authorized');
      }
    }
  }

  public async init() {
    console.log('aave initApi()');
    await super.init();
    this._Governance = this.Contract;
  }
}
