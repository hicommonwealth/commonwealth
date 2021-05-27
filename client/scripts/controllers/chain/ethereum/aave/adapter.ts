// import { AaveTypes } from '@commonwealth/chain-events';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { AaveGovernanceV2__factory } from 'eth/types';

import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, ChainEntity, ChainEvent, NodeInfo } from 'models';

import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import { notifyError } from 'controllers/app/notifications';
import { AaveTypes } from '@commonwealth/chain-events';
import AaveApi from './api';
import AaveChain from './chain';
import AaveHolders from './holders';
import AaveGovernance from './governance';

export default class Aave extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Aave;
  public chain: AaveChain;
  public accounts: EthereumAccounts;
  public holders: AaveHolders;
  public governance: AaveGovernance;
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new AaveChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.governance = new AaveGovernance(this.app);
    this.holders = new AaveHolders(this.app, this.chain, this.accounts);
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
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    const api = new AaveApi(
      AaveGovernanceV2__factory.connect,
      this.meta.address,
      this.chain.api.currentProvider as any
    );
    await api.init().catch((e) => {
      this._failed = true;
      notifyError('Failed to fetch via infura');
    });
    this.chain.aaveApi = api;
    this.block.height = await api.Provider.getBlockNumber(); // TODO: Fix the global eth block height setting
    await super.initApi();
  }

  public async initData() {
    console.log('Aave initData()');
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.holders);
    await super.initData();
  }

  public async deinit() {
    console.log('Aave deinit()');
    await super.deinit();
    this.governance.deinit();
    this.holders.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
    console.log('Ethereum/Aave stopped.');
  }
}
