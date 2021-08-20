import { IApp } from 'state';

import { ProjectFactory__factory as CMNProjectProtocolContract } from 'eth/types';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';
import ChainEntityController from 'controllers/server/chain_entities';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase } from 'types';
import { IChainAdapter, NodeInfo } from 'models';

import { CwProtocolFactory as CWProtocolFactory } from 'CwProtocolFactory';

import CMNChain from './chain';
import CMNProjectApi from './project/api';
import CMNProjectProtocol from './project/protocol';

export default class CMNAdapter extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: CMNChain;
  public accounts: EthereumAccounts; // consider backers or curators
  public protocol: CMNProjectProtocol; //  may be replaced with protoco
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CMNChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.protocol = new CMNProjectProtocol(this.app);
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);

    const projectApi = new CMNProjectApi(
      CMNProjectProtocolContract.connect,
      this.meta.address,
      this.chain.api.currentProvider as any
    );
    await projectApi.init();
    this.chain.CMNProjectApi = projectApi;

    await this.chain.initEventLoop();
    await super.initApi();
  }

  public async initData() {
    await this.chain.initEventLoop();
    await this.protocol.init(this.chain);
    await super.initData();
  }

  public async deinit() {
    await super.deinit();
    this.protocol.deinit();  // protocol.deinit
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    await this.chain.deinitApi();
    console.log('Ethereum/Commonwealth stopped.');
  }
}
