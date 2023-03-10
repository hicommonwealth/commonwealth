import type { WalletId } from 'common-common/src/types';
import app from 'state';
import Account from './Account';

class AddressInfo extends Account {
  public readonly keytype: string;
  public readonly id: number;
  public readonly profileId: number;

  constructor(
    id: number | null | undefined,
    address: string,
    chainId: string,
    keytype?: string,
    walletId?: WalletId,
    ghostAddress?: boolean,
    profileId?: number
  ) {
    const chain = app.config.chains.getById(chainId);
    if (!chain) throw new Error(`Failed to locate chain: ${chainId}`);
    super({
      address,
      chain,
      addressId: id,
      walletId,
      ghostAddress,
    });
    this.id = id;
    this.keytype = keytype;
    this.profileId = profileId;
  }
}

export default AddressInfo;
