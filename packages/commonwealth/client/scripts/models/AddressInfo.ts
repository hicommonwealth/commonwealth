import type { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import moment from 'moment';
import Account, { AccountCommunity } from './Account';

class AddressInfo extends Account {
  public readonly userId: number;

  constructor({
    userId,
    id,
    address,
    community,
    walletId,
    ghostAddress,
    lastActive,
  }: {
    userId: number;
    id: number;
    address: string;
    community: AccountCommunity;
    walletId?: WalletId;
    walletSsoSource?: WalletSsoSource;
    ghostAddress?: boolean;
    lastActive?: string | moment.Moment;
  }) {
    super({
      address,
      community,
      addressId: id,
      walletId,
      ghostAddress,
      ignoreProfile: false,
      lastActive,
    });
    this.userId = userId;
  }
}

export default AddressInfo;
