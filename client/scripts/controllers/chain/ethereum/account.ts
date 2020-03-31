import assert from 'assert';
import hdkey from 'ethereumjs-wallet/hdkey';

// tslint:disable-next-line
const ethUtil = require('ethereumjs-util'); // doesn't import otherwise
import { Wallet } from 'ethereumjs-wallet';

import app from 'state';
import { Account, IAccountsModule } from 'models/models';
import { AccountsStore } from 'models/stores';

import { default as EthereumChain } from './chain';
import { EthereumCoin } from 'shared/adapters/chain/ethereum/types';
import { mnemonicValidate } from '@polkadot/util-crypto';

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
  private _store: AccountsStore<EthereumCoin, EthereumAccount> = new AccountsStore();
  public get store() { return this._store; }

  private _Chain: EthereumChain;
  private _bip39;
  public get bip39() { return this._bip39; }

  public get(address: string) {
    return this.fromAddress(address);
  }

  public fromAddress(address: string): EthereumAccount {
    if (address.indexOf('0x') !== -1) {
      assert(address.length === 42);
    } else {
      assert(address.length === 40);
      address = `0x${address}`;
    }
    try {
      return this._store.getByAddress(address);
    } catch (e) {
      return new EthereumAccount(this._Chain, this, address);
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
  public balance: import('rxjs').Observable<EthereumCoin>;
  public sendBalanceTx(recipient: Account<EthereumCoin>, amount: EthereumCoin):
    import('../../../models/models').ITXModalData | Promise<import('../../../models/models').ITXModalData> {
    throw new Error('Method not implemented.');
  }

  private _initialized: Promise<boolean>;
  get initialized(): Promise<boolean> { return this._initialized; }

  private _Chain: EthereumChain;
  private _Accounts: EthereumAccounts;
  private wallet: Wallet;

  // CONSTRUCTORS
  constructor(ChainInfo: EthereumChain, Accounts: EthereumAccounts, address: string) {
    super(app.chain.meta.chain, address);
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
    const msgHash = ethUtil.hashPersonalMessage(Buffer.from(message));
    const sig = ethUtil.ecsign(msgHash, Buffer.from(privateKey, 'hex'));
    return ethUtil.toRpcSig(sig.v, sig.r, sig.s);
  }

  public recoverSigner(message: string, signature: string): Buffer {
    const recovered = ethUtil.fromRpcSig(signature);
    const msgHash = ethUtil.hashPersonalMessage(Buffer.from(message));
    return ethUtil.ecrecover(Buffer.from(msgHash), recovered.v, recovered.r, recovered.s);
  }

  public async isValidSignature(message: string, signature: string): Promise<boolean> {
    const msgBuffer = ethUtil.toBuffer(message.trim());
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureBuffer = ethUtil.toBuffer(signature.trim());
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    );
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);
    return (address === this.address.toLowerCase()) ? true : false ;
    // Match hex which is not case sensitive, but representation is case sen
  }
}
