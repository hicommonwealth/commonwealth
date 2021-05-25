import { EthereumCoin } from 'adapters/chain/ethereum/types';
// Factories?
import { UniFactory } from 'UniFactory';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, ChainEntity, ChainEvent, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import { notifyError } from 'controllers/app/notifications';
import { CompoundalphaTypes } from '@commonwealth/chain-events';
import CompoundalphaAPI from './api';
import CompoundalphaChain from './chain';
import CompoundalphaGovernance from './governance';
import CompoundalphaProposal from './proposal'; // TODO: Remove if unused?
import CompoundalphaHolders from './holders';

export default class Compoundalpha extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Compoundalpha;
  public chain: CompoundalphaChain;
  public accounts: EthereumAccounts;
  public compoundalphaAccounts:  CompoundalphaHolders;
  public governance: CompoundalphaGovernance;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new CompoundalphaChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.compoundalphaAccounts = new CompoundalphaHolders(this.app, this.chain, this.accounts);
    this.governance = new CompoundalphaGovernance(this.app);
    this.accounts.init(this.chain);
  }

  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    switch (entity.type) {
      case CompoundalphaTypes.EntityKind.Proposal: {
        this.governance.updateProposal(entity, event);
        break;
      }
      default: {
        console.error('Received invalid compoundalpha chain entity!');
        break;
      }
    }
  }

  public async initApi() {
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();

    const mpondContractAddress = this.meta.address;
    const governorAlphaContractAddress = ''; // TODO: Add support for multiple addresses in meta.address[]
    const api = new CompoundalphaAPI(
      UniFactory.connect,
      this.meta.address,
      governorAlphaContractAddress,
      this.chain.api.currentProvider as any,
    );
    await api.init().catch((e) => {
      this._failed = true;
      notifyError('Please change your Metamask network');
    });
    this.chain.compoundalphaApi = api;
    await this.compoundalphaAccounts.init(api);
    this.block.height = await api.Provider.getBlockNumber(); // TODO: Fix the global eth block height setting
    await super.initApi();
  }

  public async initData() {
    console.log('Compoundalpha initData()');
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.compoundalphaAccounts);
    await super.initData();
  }

  public async deinit() {
    console.log('Compoundalpha deinit()');
    await super.deinit();
    this.governance.deinit();
    this.compoundalphaAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
    console.log('Ethereum/Compoundalpha stopped.');
  }
}
