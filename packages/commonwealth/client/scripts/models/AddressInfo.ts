import { WalletId } from 'common-common/src/types';

class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly chain: string;
  public readonly keytype: string;
  public readonly walletId: WalletId;
  public readonly ghostAddress: boolean;

  constructor(id, address, chain, keytype, walletId?, ghostAddress?) {
    this.id = id;
    this.address = address;
    this.chain = chain;
    this.keytype = keytype;
    this.walletId = walletId;
    this.ghostAddress = !!ghostAddress;
  }
}

export default AddressInfo;
