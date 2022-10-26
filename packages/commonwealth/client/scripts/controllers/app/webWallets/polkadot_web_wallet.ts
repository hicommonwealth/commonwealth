import app from 'state';

import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
  isWeb3Injected,
} from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { Signer } from '@polkadot/api/types';
import { stringToHex } from '@polkadot/util';
import { SignerPayloadRaw } from '@polkadot/types/types/extrinsic';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, IWebWallet } from 'models';
import { addressSwapper } from 'commonwealth/shared/utils';
import { constructCanvasMessage } from 'commonwealth/shared/adapters/shared';
import { ApiPromise, WsProvider } from '@polkadot/api';

class PolkadotWebWalletController
  implements IWebWallet<InjectedAccountWithMeta>
{
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _accounts: InjectedAccountWithMeta[];
  private _enabling = false;

  public readonly name = WalletId.Polkadot;
  public readonly label = 'polkadot.js';
  public readonly defaultNetwork = ChainNetwork.Edgeware;
  public readonly chain = ChainBase.Substrate;

  public get available() {
    return isWeb3Injected;
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

  public async getSigner(who: string): Promise<Signer> {
    // finds an injector for an address
    // web wallet stores addresses in testnet format for now, so we have to re-encode
    const reencodedAddress = addressSwapper({
      address: who,
      currentPrefix: 42,
    });
    const injector = await web3FromAddress(reencodedAddress);
    return injector.signer;
  }

  public async getSessionPublicAddress(): Promise<string> {
    const sessionController = app.sessions.getSessionController(this.chain);
    return sessionController.getOrCreateAddress(app.chain?.id || this.defaultNetwork);
  }

  public async getRecentBlock() {
        // TODO: are we using the polkadot API anywhere else on the frontend?
    // we probably want to point to whatever substrate node we are already running instead of a public API
    const api = await ApiPromise.create({
      provider: new WsProvider("wss://rpc.polkadot.io")
    });
    const latestBlock = await api.rpc.chain.getBlock();
    const timestamp = await api.query.timestamp.now.at(latestBlock.block.hash);

    return {
      number: latestBlock.block.header.number.toNumber(),
      hash: latestBlock.block.hash.toString(),
      timestamp: timestamp.toNumber()
    };
  }

  // ACTIONS
  public async signWithAccount(account: Account): Promise<string> {
    const sessionController = app.sessions.getSessionController(ChainBase.Substrate);
    const chainId = app.chain?.id || this.defaultNetwork;
    const sessionPublicAddress = await sessionController.getOrCreateAddress(chainId);

    const signer = await this.getSigner(account.address);

    const canvasMessage = constructCanvasMessage(
      "substrate",
      chainId,
      account.address,
      sessionPublicAddress,
      account.validationBlockInfo
    );
    const message = stringToHex(JSON.stringify(canvasMessage));

    const payload: SignerPayloadRaw = {
      address: account.address,
      data: message,
      type: 'bytes',
    };
    const signature = (await signer.signRaw(payload)).signature;
    return signature;
  }

  public async validateWithAccount(
    account: Account,
    walletSignature: string
  ): Promise<void> {
    return account.validate(walletSignature);
  }

  public async enable() {
    console.log('Attempting to enable Substrate web wallet');
    if (!this.available) throw new Error('Web wallet not available');

    // returns an array of all the injected sources
    // (this needs to be called first, before other requests)
    this._enabling = true;
    try {
      const injectedExtensionInfo = await web3Enable('commonwealth');

      // returns an array of { address, meta: { name, source } }
      // meta.source contains the name of the extension that provides this account
      this._accounts = await web3Accounts();

      this._enabled = true;
      this._enabling = false;
    } catch (error) {
      console.error('Failed to enable polkadot wallet');
      this._enabling = false;
    }
  }
}

export default PolkadotWebWalletController;
