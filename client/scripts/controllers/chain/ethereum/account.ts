import assert from 'assert';
import hdkey from 'ethereumjs-wallet/hdkey';
import { Wallet } from 'ethereumjs-wallet';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { IApp } from 'state';
import { formatCoin, Coin } from 'adapters/currency';
import { Account, IAccountsModule, ITXModalData } from 'models';
import { AccountsStore } from 'stores';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import { mnemonicValidate } from '@polkadot/util-crypto';
import EthereumChain from './chain';
import { toBuffer, hashPersonalMessage, fromRpcSig, ecrecover, publicToAddress, bufferToHex, ecsign, toRpcSig } from 'ethereumjs-util';

function addressFromSeed(seed: string): string {
  return getWalletFromSeed(seed).getAddressString();
}

function addressFromMnemonic(bip39, mnemonic: string): string {
  if (!mnemonicValidate(mnemonic)) throw new Error('Invalid mnemonic');
  const seed = bip39.mnemonicToSeedSync('basket actual').toString('hex');
  return addressFromSeed(seed);
}

function getWalletFromSeed(seed: string): Wallet {
  return hdkey.fromMasterSeed(seed).getWallet();
}

function getWalletFromMnemonic(bip39, mnemonic: string): Wallet {
  if (!mnemonicValidate(mnemonic)) throw new Error('Invalid mnemonic');
  const seed = bip39.mnemonicToSeedSync('basket actual').toString('hex');
  return getWalletFromSeed(seed);
}

/**
 * Gets the address from an EthereumJS Wallet
 * @param wallet EthereumJS-Wallet format
 */
function addressFromWallet(wallet: Wallet): string {
  return wallet.getAddressString();
}

// NOTE: this is just a boilerplate class; not verified to work yet.
// TODO: hook this up to rest of the application and verify that it works
class EthereumAccounts implements IAccountsModule<EthereumCoin, EthereumAccount> {
  private _initialized: boolean = false;
  public get initialized() { return this._initialized; }

  // STORAGE
  protected _store: AccountsStore<EthereumAccount> = new AccountsStore();
  public get store() { return this._store; }

  private _Chain: EthereumChain;
  private _bip39;
  public get bip39() { return this._bip39; }

  public get(address: string) {
    return this.fromAddress(address.toLowerCase());
  }

  private _app: IApp;
  public get app() { return this._app; }

  constructor(app: IApp) {
    this._app = app;
  }

  public fromAddress(address: string): EthereumAccount {
    address = address.toLowerCase();
    if (address.indexOf('0x') !== -1) {
      assert(address.length === 42);
    } else {
      assert(address.length === 40);
      address = `0x${address}`;
    }
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      return new EthereumAccount(this.app, this._Chain, this, address);
    }
  }

  public fromSeed(seed: string): EthereumAccount {
    const address = addressFromSeed(seed);
    const acct = this.fromAddress(address);
    acct.setSeed(seed);
    return acct;
  }
  public fromMnemonic(mnemonic: string): EthereumAccount {
    const address = addressFromMnemonic(this.bip39, mnemonic);
    const acct = this.fromAddress(address);
    acct.setMnemonic(mnemonic);
    return acct;
  }

  public fromWallet(wallet: Wallet): EthereumAccount {
    const address = addressFromWallet(wallet);
    const acct = this.fromAddress(address);
    acct.setWallet(wallet);
    return acct;
  }

  public deinit() {
    this._initialized = false;
    this.store.clear();
  }

  public init(ChainInfo: EthereumChain): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // TODO: verify this boilerplate code also works with Ethereum chain API
      // UPDATE: it did not, so it was delete.
      // TODO: implement

      // only import bip39 on init to avoid leaking dependencies
      this._bip39 = await import('bip39');
      resolve();
    });
  }
}

export default EthereumAccounts;

export class EthereumAccount extends Account<EthereumCoin> {
  private _balance: Observable<EthereumCoin> ;

  public get balance(): Observable<EthereumCoin> {
    if (!this._Chain) return; // TODO
    this._balance = this._Chain.api.web3.eth.getBalance(this.address);
    return this._balance;
  }

  public tokenBalance(address: string): EthereumCoin {
    if (!this._Chain) return; // TODO
  }

  public sendBalanceTx(recipient: Account<EthereumCoin>, amount: EthereumCoin):
    ITXModalData | Promise<ITXModalData> {
    throw new Error('Method not implemented.');
  }

  public sendTx(recipient: Account<EthereumCoin>, amount: EthereumCoin):
  ITXModalData | Promise<ITXModalData> {
    throw new Error('Method not implemented.');
  }

  public tokens: Array<Observable<Coin>>;

  protected _initialized: Promise<boolean>;
  get initialized(): Promise<boolean> { return this._initialized; }

  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;
  private wallet: Wallet;

  // CONSTRUCTORS
  constructor(app: IApp, ChainInfo: EthereumChain, Accounts: EthereumAccounts, address: string) {
    super(app, app.chain.meta.chain, address.toLowerCase());
    this._Chain = ChainInfo;
    this._Accounts = Accounts;
    this._Accounts.store.add(this);
  }

  protected addressFromMnemonic(mnemonic: string) {
    return addressFromMnemonic(this._Accounts.bip39, mnemonic);
  }

  protected addressFromSeed(seed: string) {
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
      privateKey = getWalletFromMnemonic(this._Accounts.bip39, this.mnemonic).getPrivateKey().toString('hex');
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

  public async isValidSignature(message: string, signature: string): Promise<boolean> {
    const address = bufferToHex(publicToAddress(this.recoverSigner(message, signature)));
    return (address === this.address.toLowerCase()) ? true : false ;
    // Match hex which is not case sensitive, but representation is case sen
  }
}
