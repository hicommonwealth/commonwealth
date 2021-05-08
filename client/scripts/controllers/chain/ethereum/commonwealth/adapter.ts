import { EthereumCoin } from 'adapters/chain/ethereum/types';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, NodeInfo } from 'models';

import { setActiveAccount } from 'controllers/app/login';
import { IApp } from 'state';
import ChainEntityController from 'controllers/server/chain_entities';

import CommonwealthChain from './chain';
import CommonwealthAPI from './api';
import CommonwealthMembers from './members';
import CommonwealthProtocol from './protocol';

export default class Commonwealth extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Commonwealth;
  public chain: CommonwealthChain;
  public ethAccounts: EthereumAccounts;
  public accounts: CommonwealthMembers; // consider backers or curators
  public protocol: CommonwealthProtocol; //  may be replaced with protoco
  public readonly webWallet: EthWebWalletController = new EthWebWalletController();
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CommonwealthChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new CommonwealthMembers(this.app, this.chain, this.ethAccounts);
    this.protocol = new CommonwealthProtocol(this.app, !this.usingServerChainEntities);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    
    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    const api = new CommonwealthAPI(this.chain.api.currentProvider as any, activeAddress);
    await api.init();
    this.chain.CommonwealthAPI = api;

    if (this.webWallet) {
      await this.webWallet.enable();
      await this.webWallet.web3.givenProvider.on('accountsChanged', async (accounts) => {
        const updatedAddress = this.app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
        if (!updatedAddress) return;
        await setActiveAccount(updatedAddress);
      });
    }
    await this.chain.initEventLoop();
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await this.protocol.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    this.protocol.deinit();  // protocol.deinit
    this.ethAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    await this.chain.deinitApi();
    console.log('Ethereum/Commonwealth stopped.');
  }
}
