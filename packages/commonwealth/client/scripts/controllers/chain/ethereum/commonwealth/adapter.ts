import type { EthereumCoin } from 'adapters/chain/ethereum/types';
import { ChainBase, ContractType } from 'common-common/src/types';

import type EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import type { IApp } from 'state';
import type ChainInfo from '../../../../models/ChainInfo';
import IChainAdapter from '../../../../models/IChainAdapter';
import CommonwealthAPI from './api';

import CommonwealthChain from './chain';
import CommonwealthGovernance from './governance';

export default class Commonwealth extends IChainAdapter<
  EthereumCoin,
  EthereumAccount
> {
  public readonly base = ChainBase.Ethereum;
  public chain: CommonwealthChain;
  public accounts: EthereumAccounts;
  public governance: CommonwealthGovernance;

  constructor(meta: ChainInfo, app: IApp) {
    super(meta, app);
    this.chain = new CommonwealthChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.governance = new CommonwealthGovernance(this.app);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    const commonContracts = this.app.contracts.getByType(
      ContractType.COMMONPROTOCOL
    );
    if (!commonContracts || !commonContracts.length) {
      throw new Error('No Common contracts found');
    }
    const commonContract = commonContracts[0];
    const api = new CommonwealthAPI(
      () => null,
      commonContract.address,
      this.chain.api.currentProvider as any
    );
    await api.init();
    this.chain.commonwealthApi = api;
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await this.governance.init(this.chain);
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    this.governance.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    await this.chain.deinitApi();
    console.log('Ethereum/Commonwealth stopped.');
  }
}
