import BN from 'bn.js';
import { Wallet } from 'ethereumjs-wallet';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  hashPersonalMessage, fromRpcSig, ecrecover, publicToAddress, bufferToHex, ecsign, toRpcSig
} from 'ethereumjs-util';
import { providers } from 'ethers';

import { IApp } from 'state';
import { Account, ITXModalData } from 'models';
import { Erc20Factory } from 'Erc20Factory';
import { EthereumCoin, ERC20Token } from 'adapters/chain/ethereum/types';
import EthereumChain from './chain';
import EthereumAccounts, {
  getWalletFromSeed, addressFromSeed, addressFromMnemonic, getWalletFromMnemonic, addressFromWallet
} from './accounts';

export default class EthereumAccount extends Account<EthereumCoin> {
  public get balance(): Observable<EthereumCoin> {
    if (!this._Chain) return; // TODO
    return from(this._Chain.api.eth.getBalance(this.address)).pipe(
      map((v) => {
        return new EthereumCoin('ETH', new BN(v), false);
      })
    );
  }

  // Given an ERC20 token contract, fetches the balance of this account in that contract's tokens
  public async tokenBalance(contractAddress: string): Promise<ERC20Token> {
    if (!this._Chain) return; // TODO
    const token = Erc20Factory.connect(
      contractAddress,
      new providers.Web3Provider(this._Chain.api.currentProvider as any)
    );
    const balance = await token.balanceOf(this.address);
    return new ERC20Token(contractAddress, new BN(balance.toString(), 10));
  }

  public async sendTokenTx(toSend: ERC20Token, recipient: string) {
    if (!this._Chain) return;
    const token = Erc20Factory.connect(
      toSend.contractAddress,
      (new providers.Web3Provider(this._Chain.api.currentProvider as any)).getSigner(this.address),
    );
    const transferTx = await token.transfer(recipient, toSend.asBN.toString(10), { gasLimit: 3000000 });
    const transferTxReceipt = await transferTx.wait();
    if (transferTxReceipt.status !== 1) {
      throw new Error('failed to transfer tokens');
    }
    return transferTxReceipt;
  }

  public async approveTokenTx(toApprove: ERC20Token, spender: string) {
    if (!this._Chain) return; // TODO
    const token = Erc20Factory.connect(
      toApprove.contractAddress,
      (new providers.Web3Provider(this._Chain.api.currentProvider as any)).getSigner(this.address),
    );
    const approvalTx = await token.approve(
      spender,
      toApprove.asBN.toString(10),
      { gasLimit: 3000000 }
    );

    const approvalTxReceipt = await approvalTx.wait();
    if (approvalTxReceipt.status !== 1) {
      throw new Error('failed to approve amount');
    }

    // trigger update to refresh holdings
    return approvalTxReceipt;
  }

  // Given an ERC20 token contract and a spender, fetches the token amount that this account has
  // approved for "spender" to spend.
  public async tokenAllowance(contractAddress: string, spender: string): Promise<ERC20Token> {
    if (!this._Chain) return; // TODO
    const token = Erc20Factory.connect(
      contractAddress,
      new providers.Web3Provider(this._Chain.api.currentProvider as any)
    );
    const allowance = await token.allowance(this.address, spender);
    return new ERC20Token(contractAddress, new BN(allowance.toString(), 10));
  }

  public sendBalanceTx(recipient: Account<EthereumCoin>, amount: EthereumCoin):
    ITXModalData | Promise<ITXModalData> {
    throw new Error('Method not implemented.');
  }

  public sendTx(recipient: Account<EthereumCoin>, amount: EthereumCoin):
  ITXModalData | Promise<ITXModalData> {
    throw new Error('Method not implemented.');
  }

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
    return addressFromMnemonic(mnemonic);
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

  public async isValidSignature(message: string, signature: string): Promise<boolean> {
    const address = bufferToHex(publicToAddress(this.recoverSigner(message, signature)));
    return (address === this.address.toLowerCase());
    // Match hex which is not case sensitive, but representation is case sen
  }
}
