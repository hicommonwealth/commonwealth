import BN from 'bn.js';
import type { AaveTokenV2, Executor, GovernanceStrategy, IAaveGovernanceV2, } from 'common-common/src/eth/types';
import { Executor__factory, GovernanceStrategy__factory, } from 'common-common/src/eth/types';
import ContractApi from 'controllers/chain/ethereum/contractApi';

export interface AaveExecutor {
  contract: Executor;
  address: string;
  gracePeriod: number;
  voteDifferential: BN;
  minimumQuorum: BN;
  delay: number;
}

export default class AaveApi extends ContractApi<IAaveGovernanceV2> {
  private _Governance: IAaveGovernanceV2;
  public get Governance() {
    return this._Governance;
  }

  private _Strategy: GovernanceStrategy;
  public get Strategy() {
    return this._Strategy;
  }

  private _Token: AaveTokenV2;
  public get Token() {
    return this._Token;
  }

  private _Executors: AaveExecutor[];
  public get Executors() {
    return this._Executors;
  }

  public getExecutor(executorAddress: string): AaveExecutor {
    return this.Executors.find((ex) => ex.address === executorAddress);
  }

  public async init() {
    console.log('aave initApi()');
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
        const executor = Executor__factory.connect(
          address,
          this.Contract.provider
        );
        await executor.deployed();

        // fetch constants
        const gracePeriod = +(await executor.GRACE_PERIOD());
        const minimumQuorum = new BN(
          (await executor.MINIMUM_QUORUM()).toString()
        );
        const voteDifferential = new BN(
          (await executor.VOTE_DIFFERENTIAL()).toString()
        );
        const delay = +(await executor.getDelay());
        this._Executors.push({
          contract: executor,
          address: executor.address,
          gracePeriod,
          minimumQuorum,
          voteDifferential,
          delay,
        });
      }
    }

    // fetch strategy from governance
    const strategyAddress = await this.Governance.getGovernanceStrategy();
    this._Strategy = GovernanceStrategy__factory.connect(
      strategyAddress,
      this.Contract.provider
    );
    await this._Strategy.deployed();
  }
}
