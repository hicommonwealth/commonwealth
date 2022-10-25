declare let window: any;

import app from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, IWebWallet } from 'models';
import { constructCanvasMessage } from 'commonwealth/shared/adapters/shared';
import * as solw3 from '@solana/web3.js';

class PhantomWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled = false;
  private _enabling = false;
  private _accounts: string[];

  public readonly name = WalletId.Phantom;
  public readonly label = 'Phantom';
  public readonly chain = ChainBase.Solana;
  public readonly defaultNetwork = ChainNetwork.Solana;

  public get available() {
    return window.solana && window.solana.isPhantom;
  }

  public get enabled() {
    return this.available && this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts || [];
  }

  public async getRecentBlock() {
    // TODO: Use our own Solana RPC - is this configurable?
    const connection = new solw3.Connection("https://api.devnet.solana.com");
    const slot = await connection.getSlot()
    const block = await connection.getBlock(slot);

    return {
      number: slot,
      hash: block.blockhash,
      timestamp: block.blockTime
    };
  }

  public async signWithAccount(account: Account): Promise<string> {
    const sessionController = app.sessions.getSessionController(ChainBase.Solana);
    const chainId = app.chain?.id || this.defaultNetwork;
    const sessionPublicAddress = await sessionController.getOrCreateAddress(chainId);

    const canvasMessage = constructCanvasMessage(
      "solana",
      chainId,
      account.address,
      sessionPublicAddress,
      account.validationBlockInfo
    );

    const encodedMessage = new TextEncoder().encode(JSON.stringify(canvasMessage));
    const { signature } = await window.solana.signMessage(
      encodedMessage,
      'utf8'
    );
    const signedMessage = Buffer.from(signature as Uint8Array).toString(
      'base64'
    );
    return signedMessage;
  }

  public async validateWithAccount(
    account: Account,
    walletSignature: string
  ): Promise<void> {
    return account.validate(walletSignature);
  }

  // ACTIONS
  public async enable() {
    console.log('Attempting to enable Phantom');
    this._enabling = true;
    if (!this.available) {
      this._enabling = false;
      throw new Error('Phantom wallet not installed!');
    }
    try {
      const resp = await window.solana.connect();
      const key = resp.publicKey.toString();
      this._accounts = [key];
      this._enabling = false;
      this._enabled = true;
    } catch (err) {
      this._enabling = false;
      throw new Error('Could not connect to Phantom wallet!');
    }
  }
}

export default PhantomWebWalletController;
