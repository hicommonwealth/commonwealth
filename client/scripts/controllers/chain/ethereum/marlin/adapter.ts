// import { MarlinTypes } from '@commonwealth/chain-events';
import { EthereumCoin } from 'adapters/chain/ethereum/types';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, ChainEntity, ChainEvent, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import { notifyError } from 'controllers/app/notifications';
import { MarlinTypes } from '@commonwealth/chain-events';
import MarlinChain from './chain';
import MarlinGovernance from './governance';

export default class Marlin extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: MarlinChain;
  public accounts: EthereumAccounts;
  public governance: MarlinGovernance;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new MarlinChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.governance = new MarlinGovernance(this.app);
    this.accounts.init(this.chain);
  }

  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    switch (entity.type) {
      case MarlinTypes.EntityKind.Proposal: {
        this.governance.updateProposal(entity, event);
        break;
      }
      default: {
        console.error('Received invalid marlin chain entity!');
        break;
      }
    }
  }

  public async initApi() {
    try {
      await this.chain.init(this.meta);
      // TODO: Fix the global eth block height setting
      this.block.height = await this.chain.marlinApi.Provider.getBlockNumber();
      await super.initApi();
    } catch (e) {
      this._failed = true;
      notifyError('Failed to fetch via infura');
    }
  }

  public async initData() {
    console.log('Marlin initData()');
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    console.log('Marlin deinit()');
    await super.deinit();
    this.governance.deinit();
    this.accounts.deinit();
    this.chain.deinit();
    console.log('Ethereum/Marlin stopped.');
  }
}
