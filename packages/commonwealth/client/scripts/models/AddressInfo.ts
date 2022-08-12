import { ChainBase, WalletId } from 'common-common/src/types';
import { setActiveAccount, updateActiveAddressesWithGhost, verifyAddress } from '../controllers/app/login';
import Profile from './Profile';

class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly chain: string;
  public readonly keytype: string;
  public readonly walletId: WalletId;
  public readonly ghostAddress: boolean;

  public readonly chainBase: ChainBase;
  
  // validation token sent by server
  private _validationToken?: string;

  // A helper for encoding
  private _encoding: number;
  public get encoding() { return this._encoding; }

  constructor(id, address, chain, keytype?, walletId?, ghostAddress?) {
    this.id = id;
    this.address = address;
    this.chain = chain;
    this.keytype = keytype;
    this.walletId = walletId;
    this.ghostAddress = !!ghostAddress;
  }

  get validationToken() {
    return this._validationToken;
  }
  public setValidationToken(token: string) {
    this._validationToken = token;
  }
  public async validate(signature: string) {
    if (!this._validationToken) {
      throw new Error('no validation token found');
    }
    if (!signature) {
      throw new Error('signature required for validation');
    }

    console.log('back here')

    await verifyAddress(signature, this.address, this.chain);
    await updateActiveAddressesWithGhost();
  }
}

export default AddressInfo;
