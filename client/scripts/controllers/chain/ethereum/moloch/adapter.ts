
import { Moloch1Factory } from 'Moloch1Factory';
import { EthereumCoin } from 'adapters/chain/ethereum/types';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import MolochChain from './chain';
import MolochMembers from './members';
import MolochAPI from './api';
import MolochGovernance from './governance';

export default class Moloch extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: MolochChain;
  public ethAccounts: EthereumAccounts;
  public accounts: MolochMembers;
  public governance: MolochGovernance;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new MolochChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new MolochMembers(this.app, this.chain, this.ethAccounts);
    this.governance = new MolochGovernance(this.app, !this.usingServerChainEntities);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    const api = new MolochAPI(Moloch1Factory.connect, this.meta.address, this.chain.api.currentProvider as any);
    await api.init();
    this.chain.molochApi = api;
    await this.accounts.init(api);
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
    console.log('Ethereum/Moloch stopped.');
  }
}
