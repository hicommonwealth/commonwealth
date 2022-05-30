import { WalletId } from "types";

class AddressInfo {
  public readonly id: number;
  public readonly address: string;
  public readonly community_id: string;
  public readonly keytype: string;
  public readonly walletId: WalletId;
  public readonly ghostAddress: boolean;

  constructor(id, address, community_id, keytype, walletId?, ghostAddress?) {
    this.id = id;
    this.address = address;
    this.community_id = community_id;
    this.keytype = keytype;
    this.walletId = walletId;
    this.ghostAddress = !!ghostAddress;
  }
}

export default AddressInfo;
