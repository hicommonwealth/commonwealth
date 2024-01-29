import type { WalletId, WalletSsoSource } from '@hicommonwealth/core';
import moment from 'moment';
import app from 'state';
import Account from './Account';

class AddressInfo extends Account {
  public readonly keytype: string;
  public readonly id: number;
  public readonly profileId: number;

  constructor({
    id,
    address,
    chainId,
    keytype,
    walletId,
    walletSsoSource,
    ghostAddress,
    profileId,
    lastActive,
  }: {
    id: number | null | undefined;
    address: string;
    chainId: string;
    keytype?: string;
    walletId?: WalletId;
    walletSsoSource?: WalletSsoSource;
    ghostAddress?: boolean;
    profileId?: number;
    lastActive?: string | moment.Moment;
  }) {
    const chain = app.config.chains.getById(chainId);
    if (!chain) throw new Error(`Failed to locate chain: ${chainId}`);
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
    this.id = id;
    this.keytype = keytype;
    this.profileId = profileId;
  }
}

export default AddressInfo;
