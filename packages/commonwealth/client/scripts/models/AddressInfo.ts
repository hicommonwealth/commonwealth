import type { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import moment from 'moment';
import app from 'state';
import Account from './Account';

class AddressInfo extends Account {
  public readonly id: number;
  public readonly profileId: number;

  constructor({
    id,
    address,
    communityId,
    walletId,
    walletSsoSource,
    ghostAddress,
    profileId,
    lastActive,
  }: {
    id: number | null | undefined;
    address: string;
    communityId: string;
    walletId?: WalletId;
    walletSsoSource?: WalletSsoSource;
    ghostAddress?: boolean;
    profileId?: number;
    lastActive?: string | moment.Moment;
  }) {
    const chain = app.config.chains.getById(communityId);
    if (!chain) throw new Error(`Failed to locate chain: ${communityId}`);
    super({
      address,
      community: chain,
      // @ts-expect-error StrictNullChecks
      addressId: id,
      walletId,
      walletSsoSource,
      ghostAddress,
      ignoreProfile: false,
      lastActive,
    });
    // @ts-expect-error StrictNullChecks
    this.id = id;
    // @ts-expect-error StrictNullChecks
    this.profileId = profileId;
  }
}

export default AddressInfo;
