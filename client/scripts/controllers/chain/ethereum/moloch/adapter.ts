import { MolochShares } from 'adapters/chain/ethereum/types';

import EthWebWalletController from 'controllers/app/eth_web_wallet';
import EthereumAccounts, { EthereumAccount } from 'controllers/chain/ethereum/account';
import EthereumChain from 'controllers/chain/ethereum/chain';

import { ChainBase, ChainClass, IChainAdapter } from 'models';
import { setActiveAccount } from 'controllers/app/login';
import MolochMembers from './members';
import MolochAPI from './api';
import MolochGovernance from './governance';

export default class Moloch extends IChainAdapter<MolochShares, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class = ChainClass.Moloch;
  public chain: EthereumChain;
  public ethAccounts: EthereumAccounts;
  public accounts: MolochMembers;
  public governance: MolochGovernance;
  public readonly server = { };
  public readonly webWallet: EthWebWalletController = new EthWebWalletController();

  private _loaded: boolean = false;
  private _serverLoaded: boolean = false;

  get loaded() { return this._loaded; }
  get serverLoaded() { return this._serverLoaded; }

  public init = async (onServerLoaded?) => {
    const useChainProposalData = this.meta.chain.id === 'moloch-local' || !this.app.isProduction();
    // FIXME: This is breaking for me on moloch default (not local)
    // if (!this.meta.chain.chainObjectId && !useChainProposalData) {
    //   throw new Error('no chain object id found');
    // }
    console.log(`Starting ${this.meta.chain.id} on node: ${this.meta.url} at address ${this.meta.address}`);
    this.chain = new EthereumChain(this.app);
    this.ethAccounts = new EthereumAccounts(this.app);
    this.accounts = new MolochMembers(this.app);
    this.governance = new MolochGovernance(this.app);
    await this.app.threads.refreshAll(this.id, null, true);
    await this.app.comments.refreshAll(this.id, null, true);
    await this.app.reactions.refreshAll(this.id, null, true);

    this._serverLoaded = true;
    if (onServerLoaded) await onServerLoaded();

    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.ethAccounts.init(this.chain);
    await this.chain.initEventLoop();
    await this.webWallet.enable();

    const activeAddress: string = this.webWallet.accounts && this.webWallet.accounts[0];
    const api = new MolochAPI(this.meta.address, this.chain.api.currentProvider, activeAddress);
    await api.init();

    if (this.webWallet) {
      await this.webWallet.enable();
      await this.webWallet.web3.givenProvider.on('accountsChanged', (accounts) => {
        const updatedAddress = this.app.login.activeAddresses.find((addr) => addr.address === accounts[0])
        setActiveAccount(updatedAddress);
      });
    }

    await this.webWallet.web3.givenProvider.on('accountsChanged', (accounts) => {
      const updatedAddress = this.app.login.activeAddresses.find((addr) => addr.address === accounts[0])
      setActiveAccount(updatedAddress);
      api.updateSigner(accounts[0]);
    });

    await this.accounts.init(api, this.chain, this.ethAccounts);
    await this.governance.init(api, this.accounts, this.meta.chain.chainObjectId, useChainProposalData);

    this._loaded = true;
  }

  public deinit = async () => {
    this.governance.deinit();
    this.ethAccounts.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    console.log('Ethereum/Moloch stopped.');

    return Promise.resolve();
  }
}
