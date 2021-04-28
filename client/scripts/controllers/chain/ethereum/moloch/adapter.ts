import { MolochTypes } from '@commonwealth/chain-events';
import { EthereumCoin } from 'adapters/chain/ethereum/types';

import MetamaskWebWalletController from 'controllers/app/metamask_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, NodeInfo } from 'models';

import { setActiveAccount } from 'controllers/app/login';
import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import MolochChain from './chain';
import MolochMembers from './members';
import MolochAPI from './api';
import MolochGovernance from './governance';

export default class Moloch extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Moloch;
  public chain: MolochChain;
  public ethAccounts: EthereumAccounts;
  public accounts: MolochMembers;
  public governance: MolochGovernance;
  public readonly webWallet: MetamaskWebWalletController;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.webWallet = app.wallets.defaultWallet(this.base) as MetamaskWebWalletController;
    this.chain = new MolochChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new MolochMembers(this.app, this.chain, this.ethAccounts);
    this.governance = new MolochGovernance(this.app, !this.usingServerChainEntities);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    // await this.webWallet.enable();

    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    const api = new MolochAPI(this.meta.address, this.chain.api.currentProvider as any, activeAddress);
    await api.init();
    this.chain.molochApi = api;

    if (this.webWallet) {
      await this.webWallet.enable(api);
    }

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
