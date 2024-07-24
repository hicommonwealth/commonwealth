import type { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import moment from 'moment';
import app from 'state';
import Account from './Account';

class AddressInfo extends Account {
  public readonly userId: number;

  constructor({
    userId,
    id,
    address,
    communityId,
    walletId,
    walletSsoSource,
    ghostAddress,
    lastActive,
  }: {
    userId: number;
    id: number;
    address: string;
    communityId: string;
    walletId?: WalletId;
    walletSsoSource?: WalletSsoSource;
    ghostAddress?: boolean;
    lastActive?: string | moment.Moment;
  }) {
    const chain = app.config.chains.getById(communityId);
    if (!chain) throw new Error(`Failed to locate chain: ${communityId}`);
    super({
      address,
      community: chain,
      addressId: id,
      walletId,
      walletSsoSource,
      ghostAddress,
      ignoreProfile: false,
      lastActive,
    });
    this.userId = userId;
  }
}

export default AddressInfo;
