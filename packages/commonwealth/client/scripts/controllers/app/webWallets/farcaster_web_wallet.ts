import { SIWESigner } from '@canvas-js/chain-ethereum';
import { ChainBase, ChainNetwork, WalletId } from '@hicommonwealth/shared';
import type BlockInfo from '../../../models/BlockInfo';
import type IWebWallet from '../../../models/IWebWallet';

class FarcasterWebWalletController implements IWebWallet<string> {
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _enabling = false;
  private _accounts: string[] = [];
  private _signature = '';
  private _message = '';

  constructor(signature: string, message: string) {
    this._signature = signature;
    this._message = message;
    this._enabled = false;
  }

  public readonly name = WalletId.Farcaster;
  public readonly label = 'Farcaster';
  public readonly defaultNetwork = ChainNetwork.Ethereum;
  public readonly chain = ChainBase.Ethereum;

  public get available() {
    return true; // Farcaster is always available as it's handled externally
  }

  public get enabled() {
    return this._enabled;
  }

  public get enabling() {
    return this._enabling;
  }

  public get accounts() {
    return this._accounts;
  }

  public getChainId() {
    return '1'; // Ethereum mainnet
  }

  public async getRecentBlock(): Promise<BlockInfo | null> {
    return null; // Farcaster doesn't need block info
  }

  public getSessionSigner() {
    if (!this._accounts[0] || !this._signature || !this._message) {
      throw new Error('Farcaster wallet not properly initialized');
    }

    return new SIWESigner({
      signer: {
        getAddress: () => this._accounts[0],
        signMessage: () => Promise.resolve(this._signature),
      },
      chainId: parseInt(this.getChainId()),
    });
  }

  public async enable() {
    console.log('Enabling Farcaster wallet');
    this._enabling = true;
    try {
      if (!this._signature || !this._message) {
        throw new Error('Signature and message must be provided');
      }
      // Extract the Ethereum address from the SIWE message
      const addressMatch = this._message.match(
        /^.*wants you to sign in with your Ethereum account:\n(0x[a-fA-F0-9]{40})/,
      );
      if (!addressMatch) {
        throw new Error('Could not extract Ethereum address from message');
      }

      this._accounts = [addressMatch[1]];
      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      this._enabling = false;
      throw error;
    }
  }
}

export default FarcasterWebWalletController;
