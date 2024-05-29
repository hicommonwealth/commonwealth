import { ChainBase } from '@hicommonwealth/shared';
import type { EthereumCoin } from 'adapters/chain/ethereum/types';

import { notifyError } from 'controllers/app/notifications';

import type EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';

import type { IApp } from 'state';
import type ChainInfo from '../../../../models/ChainInfo';
import IChainAdapter from '../../../../models/IChainAdapter';
import CompoundChain from './chain';
import CompoundGovernance from './governance';

export default class Compound extends IChainAdapter<
  EthereumCoin,
  EthereumAccount
> {
  public readonly base = ChainBase.Ethereum;
  public chain: CompoundChain;
  public accounts: EthereumAccounts;
  public governance: CompoundGovernance;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new CompoundChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.governance = new CompoundGovernance(this.app);
    this.accounts.init(this.chain);
  }

  public async initApi() {
    try {
      await this.chain.init(this.meta);
      // TODO: Fix the global eth block height setting
      this.block.height =
        await this.chain.compoundApi.Provider.getBlockNumber();
      await super.initApi();
    } catch (e) {
      this._failed = true;
      notifyError('Failed to initialize API.');
    }
  }

  public async initData() {
    console.log('Compound initData()');
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    console.log('Compound deinit()');
    await super.deinit();
    this.governance.deinit();
    this.accounts.deinit();
    this.chain.deinit();
    console.log('Ethereum/compound stopped.');
  }
}
