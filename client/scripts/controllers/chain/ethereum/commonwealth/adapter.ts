import { EthereumCoin } from 'adapters/chain/ethereum/types';

import MetamaskWebWalletController from 'controllers/app/metamask_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, NodeInfo } from 'models';

import { setActiveAccount } from 'controllers/app/login';
import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import CommonwealthChain from './chain';
import CommonwealthMembers from './members';
import CommonwealthAPI from './api';
import CommonwealthGovernance from './governance';

export default class Commonwealth extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Commonwealth;
  public chain: CommonwealthChain;
  public ethAccounts: EthereumAccounts;
  public accounts: CommonwealthMembers;
  public governance: CommonwealthGovernance;
  public readonly webWallet: MetamaskWebWalletController;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.webWallet = app.wallets.defaultWallet(this.base) as MetamaskWebWalletController;
    this.chain = new CommonwealthChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new CommonwealthMembers(this.app);
    this.governance = new CommonwealthGovernance(this.app, !this.usingServerChainEntities);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    await this.webWallet.enable();

    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    const api = new CommonwealthAPI(this.meta.address, this.chain.api.currentProvider as any, activeAddress);
    await api.init();
    this.chain.commonwealthApi = api;

    if (this.webWallet) {
      await this.webWallet.enable(api);
    }

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
