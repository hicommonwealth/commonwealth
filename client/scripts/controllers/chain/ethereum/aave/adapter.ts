import { EthereumCoin } from 'adapters/chain/ethereum/types';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, IChainAdapter, ChainEntity, ChainEvent, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import { notifyError } from 'controllers/app/notifications';
import { AaveTypes } from '@commonwealth/chain-events';
import AaveChain from './chain';
import AaveGovernance from './governance';

export default class Aave extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public chain: AaveChain;
  public accounts: EthereumAccounts;
  public governance: AaveGovernance;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new AaveChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.governance = new AaveGovernance(this.app);
    this.accounts.init(this.chain);
  }

  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    switch (entity.type) {
      case AaveTypes.EntityKind.Proposal: {
        this.governance.updateProposal(entity, event);
        break;
      }
      default: {
        console.error('Received invalid aave chain entity!');
        break;
      }
    }
  }

  public async initApi() {
    try {
      await this.chain.init(this.meta);
      // TODO: Fix the global eth block height setting
      this.block.height = await this.chain.aaveApi.Provider.getBlockNumber();
      await super.initApi();
    } catch (e) {
      this._failed = true;
      notifyError('Failed to fetch via infura');
      console.error(`Aave init error: ${e.message}`);
    }
  }

  public async initData() {
    console.log('Aave initData()');
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.accounts);
    await super.initData();
  }

  public async deinit() {
    console.log('Aave deinit()');
    await super.deinit();
    this.governance.deinit();
    this.accounts.deinit();
    this.chain.deinit();
    console.log('Ethereum/Aave stopped.');
  }
}
