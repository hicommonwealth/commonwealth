import { ethers } from 'ethers';

import { EthereumCoin } from 'adapters/chain/ethereum/types';

import MetamaskWebWalletController from 'controllers/app/metamask_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, NodeInfo } from 'models';

import { setActiveAccount } from 'controllers/app/login';
import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import EthereumTokenChain from './chain';
import TokenAPI from './api';

export default class Token extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class;
  public readonly contractAddress;
  public readonly isToken = true;

  public chain: EthereumTokenChain;
  public accounts: EthereumAccounts;
  public hasToken: boolean = false;

  public readonly webWallet: MetamaskWebWalletController;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.webWallet = app.wallets.defaultWallet(this.base) as MetamaskWebWalletController;
    this.chain = new EthereumTokenChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.class = meta.chain.network;
    this.contractAddress = meta.address;
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);

    if (this.webWallet) {
      await this.webWallet.enable();
    }

    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    const api = new TokenAPI(this.meta.address, this.chain.api.currentProvider as any, activeAddress);
    await api.init();
    this.chain.tokenAPI = api;
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await super.initData();
    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    await this.activeAddressHasToken(activeAddress);
  }

  public async deinit() {
    await super.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
  }

  public async getEthersProvider() {
    const provider = new ethers.providers.Web3Provider(this.chain.api.currentProvider as any);
    return provider;
  }

  public async activeAddressHasToken(activeAddress?: string) {
    if (!activeAddress) return false;
    const account = this.accounts.get(activeAddress);
    const balance = await account.tokenBalance(this.contractAddress);
    this.hasToken = balance && !balance.isZero();
  }
}
