import { EthereumCoin } from 'adapters/chain/ethereum/types';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import CommonwealthChain from './chain';
import CommonwealthMembers from './members';
import CommonwealthAPI from './api';
import CommonwealthGovernance from './governance';

export default class Commonwealth extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: CommonwealthChain;
  public ethAccounts: EthereumAccounts;
  public accounts: CommonwealthMembers;
  public governance: CommonwealthGovernance;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CommonwealthChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new CommonwealthMembers(this.app);
    this.governance = new CommonwealthGovernance(this.app, !this.usingServerChainEntities);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    const api = new CommonwealthAPI(() => null, this.meta.address, this.chain.api.currentProvider as any);
    await api.init();
    this.chain.commonwealthApi = api;
    await this.accounts.init(api, this.chain, this.ethAccounts);
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    this.governance.deinit();
    this.ethAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    await this.chain.deinitApi();
    console.log('Ethereum/Commonwealth stopped.');
  }
}
