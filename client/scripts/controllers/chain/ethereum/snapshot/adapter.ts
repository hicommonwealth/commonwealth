import { EthereumCoin } from 'adapters/chain/ethereum/types';

import { ERC20__factory } from 'eth/types';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import SnapshotTokenChain from './chain';
import SnapshotApi from './api';

export default class Snapshot extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  // TODO: ensure this chainnetwork -> chainclass
  public readonly class;
  public readonly contractAddress: string;
  public readonly isToken = true;

  public chain: SnapshotTokenChain;
  public accounts: EthereumAccounts;
  public hasToken: boolean = false;

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new SnapshotTokenChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.class = meta.chain.network;
    this.contractAddress = meta.address;
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    const api = new SnapshotApi(ERC20__factory.connect, this.meta.address, this.chain.api.currentProvider as any);
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
    const account = this.accounts.get(activeAddress);
    const balance = await account.tokenBalance(this.contractAddress);
    this.hasToken = balance && !balance.isZero();
  }
}
