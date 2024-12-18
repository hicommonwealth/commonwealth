import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import type { IApp } from 'state';
import { z } from 'zod';
import IChainAdapter from '../../../models/IChainAdapter';
import type CosmosAccount from './account';
import CosmosAccounts from './accounts';
import CosmosChain from './chain';
import CosmosGovernanceV1AtomOne from './gov/atomone/governance-v1';
import CosmosGovernanceGovgen from './gov/govgen/governance-v1beta1';
import CosmosGovernanceV1 from './gov/v1/governance-v1';
import CosmosGovernance from './gov/v1beta1/governance-v1beta1';
import type { CosmosToken } from './types';

class Cosmos extends IChainAdapter<CosmosToken, CosmosAccount> {
  public chain: CosmosChain;
  public accounts: CosmosAccounts;
  public governance:
    | CosmosGovernance
    | CosmosGovernanceV1
    | CosmosGovernanceGovgen
    | CosmosGovernanceV1AtomOne;

  public readonly base = ChainBase.CosmosSDK;

  constructor(meta: z.infer<typeof ExtendedCommunity>, app: IApp) {
    super(meta, app);
    this.chain = new CosmosChain(this.app);
    this.accounts = new CosmosAccounts(this.app);
    this.governance =
      meta?.ChainNode?.cosmos_gov_version === 'v1beta1govgen'
        ? new CosmosGovernanceGovgen(this.app)
        : meta?.ChainNode?.cosmos_gov_version === 'v1atomone'
          ? new CosmosGovernanceV1AtomOne(this.app)
          : meta?.ChainNode?.cosmos_gov_version === 'v1'
            ? new CosmosGovernanceV1(this.app)
            : new CosmosGovernance(this.app);
  }

  public async initApi() {
    await this.chain.init(this.meta);
    await this.accounts.init(this.chain);
    await super.initApi();
  }

  public async initData() {
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit(): Promise<void> {
    await super.deinit();
    await this.governance.deinit();
    await this.accounts.deinit();
    await this.chain.deinit();
    console.log('Cosmos stopped.');
  }
}

export default Cosmos;
