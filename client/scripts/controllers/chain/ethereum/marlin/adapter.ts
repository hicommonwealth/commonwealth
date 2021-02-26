// import { MarlinTypes } from '@commonwealth/chain-events';
import { MPond, EthereumCoin } from 'adapters/chain/ethereum/types';

import EthWebWalletController from 'controllers/app/eth_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import EthereumChain from 'controllers/chain/ethereum/chain';
import { ChainBase, ChainClass, IChainAdapter, ChainEntity, ChainEvent, NodeInfo } from 'models';

import { setActiveAccount } from 'controllers/app/login';
import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import { notifyError } from 'controllers/app/notifications';
import { MarlinTypes } from '@commonwealth/chain-events';
import MarlinAPI from './api';
import MarlinChain from './chain';
import MarlinGovernance from './governance';
import MarlinProposal from './proposal';
import MarlinHolders from './holders';

export default class Marlin extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Marlin;
  public chain: MarlinChain;
  public accounts: EthereumAccounts;
  public marlinAccounts:  MarlinHolders;
  public governance: MarlinGovernance;
  public readonly webWallet: EthWebWalletController = new EthWebWalletController();
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new MarlinChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.marlinAccounts = new MarlinHolders(this.app, this.chain, this.accounts);
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
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.webWallet.enable().catch((e) => console.error(e));

    const activeAddress: string = await this.webWallet.accounts[0];
    const mpondContractAddress = this.meta.address;
    const governorAlphaContractAddress = '0x777992c2E4EDF704e49680468a9299C6679e37F6';
    const api = new MarlinAPI(
      this.meta.address,
      governorAlphaContractAddress,
      this.chain.api.currentProvider as any,
      activeAddress,
    );
    await api.init().catch((e) => {
      this._failed = true;
      notifyError('Please change your Metamask network');
    });
    this.chain.marlinApi = api;

    if ((window as any).ethereum || (window as any).web3) {
      if (!this.webWallet.enabled) await this.webWallet.enable().catch((e) => console.error(e));

      await this.webWallet.web3.givenProvider.on('accountsChanged', (accounts) => {
        const updatedAddress = this.app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
        setActiveAccount(updatedAddress);
        api.updateSigner(accounts[0]);
      });
    }

    await this.marlinAccounts.init(api);
    this.block.height = await api.Provider.getBlockNumber(); // TODO: Fix the global eth block height setting
    await super.initApi();
  }

  public async initData() {
    console.log('Marlin initData()');
    await this.chain.initEventLoop();
    await this.governance.init(this.chain, this.marlinAccounts);
    await super.initData();
  }

  public async deinit() {
    console.log('Marlin deinit()');
    await super.deinit();
    this.governance.deinit();
    this.marlinAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
    console.log('Ethereum/Marlin stopped.');
  }
}
