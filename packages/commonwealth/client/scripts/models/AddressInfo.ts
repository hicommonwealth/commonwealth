import type { WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import moment from 'moment';
import { userStore } from '../state/ui/user';
import Account, { AccountCommunity } from './Account';
import MinimumProfile from './MinimumProfile';

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
    const authUser = userStore.getState();
    const ignoreProfile = userId === authUser.id ? true : false;
    super({
      address,
      community,
      addressId: id,
      walletId,
      ghostAddress,
      profile: (() => {
        if (!ignoreProfile) return undefined;

        // if this is auth user, use already fetched address/profile data
        const foundAddress = authUser.addresses.find(
          (a) => a.address === address && a.community.id === community.id,
        );
        const profile = new MinimumProfile(address, community.id);
        profile.initialize(
          userId,
          '', // user name - not needed for auth user
          address,
          '', // user avatar url - not needed for auth user
          community.id,
          foundAddress?.lastActive?.toDate?.() || null,
        );
        return profile;
      })(),
      ignoreProfile,
      lastActive,
    });
    this.userId = userId;
  }
}

export default AddressInfo;
