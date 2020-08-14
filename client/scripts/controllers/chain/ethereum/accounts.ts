import assert from 'assert';
import hdkey from 'ethereumjs-wallet/hdkey';
import { Wallet } from 'ethereumjs-wallet';
import { IApp } from 'state';
import { IAccountsModule } from 'models';
import { AccountsStore } from 'stores';
import { EthereumCoin } from 'adapters/chain/ethereum/types';
import bip39 from 'bip39';
import EthereumChain from './chain';
import EthereumAccount from './account';

export function getWalletFromSeed(seed: string): Wallet {
  return hdkey.fromMasterSeed(seed).getWallet();
}

export function addressFromSeed(seed: string): string {
  return getWalletFromSeed(seed).getAddressString();
}

export function addressFromMnemonic(mnemonic: string): string {
  if (!bip39.validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic');
  const seed = bip39.mnemonicToSeedSync('basket actual').toString('hex');
  return addressFromSeed(seed);
}

export function getWalletFromMnemonic(mnemonic: string): Wallet {
  if (!bip39.validateMnemonic(mnemonic)) throw new Error('Invalid mnemonic');
  const seed = bip39.mnemonicToSeedSync('basket actual').toString('hex');
  return getWalletFromSeed(seed);
}

/**
 * Gets the address from an EthereumJS Wallet
 * @param wallet EthereumJS-Wallet format
 */
export function addressFromWallet(wallet: Wallet): string {
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
    const address = addressFromMnemonic(mnemonic);
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
    this._Chain = ChainInfo;
    return Promise.resolve();
  }
}

export default EthereumAccounts;
