import BN from 'bn.js';
import { Wallet } from 'ethereumjs-wallet';
import {
  hashPersonalMessage, fromRpcSig, ecrecover, ecsign, toRpcSig
} from 'ethereumjs-util';

import { IApp } from 'state';
import { Account } from 'models';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import EthereumChain from './chain';
import EthereumAccounts, {
  getWalletFromSeed, addressFromSeed, addressFromMnemonic, getWalletFromMnemonic, addressFromWallet
} from './accounts';

export default class EthereumAccount extends Account<EthereumCoin> {
  public get balance(): Promise<EthereumCoin> {
    if (!this._Chain) return; // TODO
    return this._Chain.api.eth.getBalance(this.address).then(
      (v) => new EthereumCoin('ETH', new BN(v), false)
    );
  }

  protected _initialized: Promise<boolean>;
  get initialized(): Promise<boolean> { return this._initialized; }

  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;
  private wallet: Wallet;

  // CONSTRUCTORS
  constructor(app: IApp, ChainInfo: EthereumChain, Accounts: EthereumAccounts, address: string) {
    super(app, app.chain.meta.chain, address);
    if (!app.isModuleReady) {
      // defer chain initialization
      app.chainModuleReady.once('ready', () => {
        if (app.chain.chain instanceof EthereumChain) {
          this._Chain = app.chain.chain;
        } else {
          console.error('Did not successfully initialize account with chain');
        }
      });
    } else {
      this._Chain = ChainInfo;
    }
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  protected async addressFromMnemonic(mnemonic: string) {
    return addressFromMnemonic(mnemonic);
  }

  protected async addressFromSeed(seed: string) {
    return addressFromSeed(seed);
  }

  protected addressFromWallet(wallet: Wallet): string {
    return addressFromWallet(wallet);
  }

  public setWallet(wallet: Wallet) {
    this.wallet = wallet;
  }

  /**
   * Signs a message using an Ethereum private key.
   *
   * An example of what the ECDSA signature actually is:
   * const ret = {
   *   r: sig.signature.slice(0, 32),
   *   s: sig.signature.slice(32, 64),
   *   v: chainId ? recovery + (chainId * 2 + 35) : recovery + 27,
   * }
   *
   * Here we use no specified chainID as we are signing for mainnet.
   * If we want to sign for Ropsten, we should use chainId = 3.
   * TODO: Decide how to incorporate other Ethereum networks.
   *
   * @param message Message to be signed
   * @returns a concatenated ECDSA signature.
   */
  public async signMessage(message: string): Promise<string> {
    let privateKey;
    if (this.seed) {
      privateKey = getWalletFromSeed(this.seed).getPrivateKey().toString('hex');
    } else if (this.mnemonic) {
      privateKey = getWalletFromMnemonic(this.mnemonic).getPrivateKey().toString('hex');
    } else if (this.wallet) {
      privateKey = this.wallet.getPrivateKey().toString('hex');
    } else {
      throw new Error('Account must have seed or mnemonic to sign messages');
    }
    const msgHash = hashPersonalMessage(Buffer.from(message));
    const sig = ecsign(msgHash, Buffer.from(privateKey, 'hex'));
    return toRpcSig(sig.v, sig.r, sig.s);
  }

  public recoverSigner(message: string, signature: string): Buffer {
    const recovered = fromRpcSig(signature);
    const msgHash = hashPersonalMessage(Buffer.from(message));
    return ecrecover(Buffer.from(msgHash), recovered.v, recovered.r, recovered.s);
  }
}
