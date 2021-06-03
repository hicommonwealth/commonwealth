import { EthereumCoin } from 'adapters/chain/ethereum/types';

import { IApp } from 'state';
import ChainEntityController from 'controllers/server/chain_entities';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, NodeInfo } from 'models';

import { CwProtocolFactory as CWProtocolFactory } from 'CwProtocolFactory';

import CommonwealthChain from './chain';
import CommonwealthAPI from './api';
import CommonwealthProtocol from './protocol';

export default class Commonwealth extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Commonwealth;
  public chain: CommonwealthChain;
  public accounts: EthereumAccounts; // consider backers or curators
  public protocol: CommonwealthProtocol; //  may be replaced with protoco
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CommonwealthChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.protocol = new CommonwealthProtocol(this.app);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);
    const api = new CommonwealthAPI(
      CWProtocolFactory.connect,
      this.meta.address, // CW Protocol deployed address: '0xa995cc3127BDB3E26B3c12c317E3Fa170424f0Eb'
      this.chain.api.currentProvider as any
    );    
    await api.init();
    this.chain.CommonwealthAPI = api;
    // await this.chain.initEventLoop();
    await super.initApi();
  }

  public async initData() {
    // await this.chain.initEventLoop();
    await this.protocol.init(this.chain);
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    this.protocol.deinit();  // protocol.deinit
    this.accounts.deinit();
    this.chain.deinitMetadata();
    // this.chain.deinitEventLoop();
    await this.chain.deinitApi();
    console.log('Ethereum/Commonwealth stopped.');
  }
}