import { ethers } from 'ethers';

import { EthereumCoin } from 'adapters/chain/ethereum/types';

import { Erc20Factory } from 'Erc20Factory';
import MetamaskWebWalletController from 'controllers/app/webWallets/metamask_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import EthereumTokenChain from './chain';
import TokenApi from './api';

export default class Token extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  // TODO: ensure this chainnetwork -> chainclass
  public readonly class;
  public readonly contractAddress: string;
  public readonly isToken = true;

  public chain: EthereumTokenChain;
  public accounts: EthereumAccounts;
  public hasToken: boolean = false;

  public readonly webWallet: MetamaskWebWalletController;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new EthereumTokenChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.class = meta.chain.network;
    this.contractAddress = meta.address;
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    const api = new TokenApi(Erc20Factory.connect, this.meta.address, this.chain.api.currentProvider as any);
    await api.init();
    this.chain.contractApi = api;
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await super.initData();
    await this.activeAddressHasToken(this.app.user.activeAccount.address);
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
