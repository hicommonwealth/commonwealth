import { MolochShares, EthereumCoin } from 'adapters/chain/ethereum/types';

import EthWebWalletController from 'controllers/app/eth_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumChain from 'controllers/chain/ethereum/chain';
import ChainEntityController, { EntityRefreshOption } from 'controllers/server/chain_entities';

import { ChainBase, ChainClass, IChainAdapter, ChainEntity, ChainEvent } from 'models';
import { MolochEntityKind } from 'events/moloch/types';
import { setActiveAccount } from 'controllers/app/login';
import MolochMembers from './members';
import MolochAPI from './api';
import MolochGovernance from './governance';
import MolochProposal from './proposal';

export default class Moloch extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Moloch;
  public chain: EthereumChain;
  public ethAccounts: EthereumAccounts;
  public accounts: MolochMembers;
  public governance: MolochGovernance;
  public readonly webWallet: EthWebWalletController = new EthWebWalletController();
  public readonly chainEntities = new ChainEntityController();

  private _loaded: boolean = false;
  get loaded() { return this._loaded; }

  public handleEntityUpdate(entity: ChainEntity, event: ChainEvent): void {
    switch (entity.type) {
      case MolochEntityKind.Proposal: {
        const constructorFunc = (e: ChainEntity) => new MolochProposal(this.accounts, this.governance, e);
        this.governance.updateProposal(constructorFunc, entity, event);
        break;
      }
      default: {
        console.error('Received invalid substrate chain entity!');
        break;
      }
    }
  }

  public async init() {
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url} at address ${this.meta.address}`);
    this.chain = new EthereumChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new MolochMembers(this.app);
    this.governance = new MolochGovernance(this.app);

    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    await this.chain.initEventLoop();
    await this.webWallet.enable();

    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    const api = new MolochAPI(this.meta.address, this.chain.api.currentProvider as any, activeAddress);
    await api.init();

    if (this.webWallet) {
      await this.webWallet.enable();
      await this.webWallet.web3.givenProvider.on('accountsChanged', (accounts) => {
        const updatedAddress = this.app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
        setActiveAccount(updatedAddress);
      });
    }

    await this.webWallet.web3.givenProvider.on('accountsChanged', (accounts) => {
      const updatedAddress = this.app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
      setActiveAccount(updatedAddress);
      api.updateSigner(accounts[0]);
    });

    await this.accounts.init(api, this.chain, this.ethAccounts);
    await this.governance.init(api, this.accounts, !this.usingServerChainEntities);
    await this._postModuleLoad(this.usingServerChainEntities);

    this._loaded = true;
  }

  public async deinit() {
    this.governance.deinit();
    this.ethAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
    console.log('Ethereum/Moloch stopped.');

    return Promise.resolve();
  }
}
