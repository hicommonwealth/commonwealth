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
import { AddressInfo, IWebWallet } from 'models';
import { addressSwapper } from 'commonwealth/shared/utils';

class PolkadotWebWalletController
  implements IWebWallet<InjectedAccountWithMeta>
{
  // GETTERS/SETTERS
  private _enabled: boolean;
  private _accounts: InjectedAccountWithMeta[];
  private _enabling = false;

  public readonly name = WalletId.Polkadot;
  public readonly label = 'polkadot.js';
  public readonly chain = ChainBase.Substrate;
  public readonly defaultNetwork: ChainNetwork.Edgeware;

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

  // ACTIONS
  public async validateWithAccount(account: AddressInfo): Promise<void> {
    const signer = await this.getSigner(account.address);
    const token = account.validationToken;
    const payload: SignerPayloadRaw = {
      address: account.address,
      data: stringToHex(token),
      type: 'bytes',
    };
    const signature = (await signer.signRaw(payload)).signature;
    return account.validate(signature);
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
