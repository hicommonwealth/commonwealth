import type { WalletId } from 'common-common/src/types';
import app from 'state';
import Account from './Account';

class AddressInfo extends Account {
  public readonly keytype: string;
  public readonly id: number;

  constructor(
    id: number | null | undefined,
    address: string,
    chainId: string,
    keytype?: string,
    walletId?: WalletId,
    ghostAddress?: boolean
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
  }
}

export default AddressInfo;
