import { EthereumCoin } from 'adapters/chain/ethereum/types';

import { Erc20Factory } from 'Erc20Factory';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, NodeInfo } from 'models';

import { IApp } from 'state';

import EthereumTokenChain from './chain';
import TokenApi from './api';

export default class Token extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly contractAddress: string;
  public readonly isToken = true;

  public chain: EthereumTokenChain;
  public accounts: EthereumAccounts;
  public hasToken: boolean = false;

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new EthereumTokenChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
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
    await this.activeAddressHasToken(this.app.user?.activeAccount?.address);
  }

  public async deinit() {
    await super.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
  }

  public async activeAddressHasToken(activeAddress?: string) {
    if (!activeAddress) return false;
    this.hasToken = false;
    const account = this.accounts.get(activeAddress);
    const balance = await account.tokenBalance(this.contractAddress);
    this.hasToken = balance && !balance.isZero();
  }
}
