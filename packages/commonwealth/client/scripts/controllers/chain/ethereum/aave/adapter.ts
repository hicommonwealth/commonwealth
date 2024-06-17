import { ChainBase } from '@hicommonwealth/shared';
import type { EthereumCoin } from 'adapters/chain/ethereum/types';

import { notifyError } from 'controllers/app/notifications';

import type EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import type { IApp } from 'state';
import type ChainInfo from '../../../../models/ChainInfo';
import IChainAdapter from '../../../../models/IChainAdapter';
import AaveChain from './chain';
import AaveGovernance from './governance';

export default class Aave extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: AaveChain;
  public accounts: EthereumAccounts;
  public governance: AaveGovernance;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new AaveChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.governance = new AaveGovernance(this.app);
    this.accounts.init(this.chain);
  }

  public async initApi() {
    try {
      await this.chain.init(this.meta);
      // TODO: Fix the global eth block height setting
      this.block.height = await this.chain.aaveApi.Provider.getBlockNumber();
      await super.initApi();
    } catch (e) {
      this._failed = true;
      notifyError('Failed to fetch from web3 provider');
      console.error(`Aave init error: ${e.message}`);
    }
  }

  public async initData() {
    console.log('Aave initData()');
    this.chain.initEventLoop();
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    console.log('Aave deinit()');
    await super.deinit();
    this.governance.deinit();
    this.accounts.deinit();
    this.chain.deinit();
    console.log('Ethereum/Aave stopped.');
  }
}
