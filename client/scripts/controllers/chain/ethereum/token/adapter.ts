import { ethers } from 'ethers';

import { EthereumCoin } from 'adapters/chain/ethereum/types';

import EthWebWalletController from 'controllers/app/eth_web_wallet';
import EthereumAccount from 'controllers/chain/ethereum/account';
import EthereumAccounts from 'controllers/chain/ethereum/accounts';
import { ChainBase, ChainClass, IChainAdapter, NodeInfo } from 'models';

import { setActiveAccount } from 'controllers/app/login';
import ChainEntityController from 'controllers/server/chain_entities';
import { IApp } from 'state';

import EthereumChain from '../chain';

export default class Token extends IChainAdapter<EthereumCoin, EthereumAccount> {
  public readonly base = ChainBase.Ethereum;
  public readonly class;
  public readonly contractAddress;

  public chain: EthereumChain;
  public accounts: EthereumAccounts;

  public readonly webWallet: EthWebWalletController = new EthWebWalletController();
  public readonly chainEntities = new ChainEntityController();

  constructor(meta: NodeInfo, app: IApp) {
    super(meta, app);
    this.chain = new EthereumChain(this.app);
    this.accounts = new EthereumAccounts(this.app);
    this.class = meta.chain.network;
    this.contractAddress = meta.address;
    this.initApi();
  }

  public async initApi() {
    console.log('beginning of initAPI');
    await this.chain.resetApi(this.meta);
    await this.chain.initMetadata();
    await this.accounts.init(this.chain);

    if (this.webWallet) {
      await this.webWallet.enable();
      await this.webWallet.web3.givenProvider.on('accountsChanged', async (accounts) => {
        const updatedAddress = this.app.user.activeAccounts.find((addr) => addr.address === accounts[0]);
        await setActiveAccount(updatedAddress);
      });
    }

    this.activeAddressHasToken();

    await this.chain.initEventLoop();
    await super.initApi();
  }

  public async deinit() {
    await super.deinit();
    this.accounts.deinit();
    this.chain.deinitMetadata();
    this.chain.deinitEventLoop();
    this.chain.deinitApi();
  }

  public async getEthersProvider() {
    const provider = new ethers.providers.Web3Provider(this.chain.api.currentProvider as any);
    return provider;
  }

  public async activeAddressHasToken(): Promise<boolean> {
    if (!this.app.user.activeAccount) return false;
    const address = this.accounts.get(this.app.user.activeAccount.address);
    const balance = await address.tokenBalance(this.contractAddress);
    console.log('balance of token', balance);
    return !balance.isZero();
  }
}
