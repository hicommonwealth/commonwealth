import { AddressView } from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import jdenticon from 'jdenticon';
import { z } from 'zod';

export type UserProfile = {
  userId: number;
  name: string;
  address: string;
  lastActive: string;
  avatarUrl: string;
};

export function addressToUserProfile(
  address: z.infer<typeof AddressView>,
): UserProfile {
  return {
    userId: address.user_id ?? address.User?.id ?? 0,
    avatarUrl: address.User?.profile.avatar_url ?? '',
    name: address.User?.profile.name ?? DEFAULT_NAME,
    address: address?.address,
    lastActive: (
      address?.last_active ??
      address.User?.created_at ??
      new Date()
    )?.toString(),
  };
}

class MinimumProfile {
  private _userId: number;
  private _name: string;
  private _address: string;
  private _avatarUrl: string;
  private _chain: string;
  private _lastActive: Date | null;
  private _initialized: boolean;

  get userId() {
    return this._userId;
  }

  get name() {
    if (!this._initialized) return 'Loading...';
    return this._name || DEFAULT_NAME;
  }

  get address() {
    return this._address;
  }

  get avatarUrl() {
    return this._avatarUrl;
  }

  get lastActive() {
    return this._lastActive;
  }

  get chain() {
    return this._chain;
  }

  get initialized() {
    return this._initialized;
  }

  constructor(address, chain) {
    this._address = address;
    this._chain = chain;
  }

  public initialize(
    userId: number,
    name: string,
    address: string,
    avatarUrl: string,
    chain: string,
    lastActive: Date | null,
  ) {
    this._userId = userId;
    this._name = name;
    this._address = address;
    this._avatarUrl = avatarUrl;
    this._chain = chain;
    this._lastActive = lastActive;
    this._initialized = true;
  }

  public static fromJSON(json) {
    return new MinimumProfile(json.address, json.chain);
  }

  public static getSVGAvatar(address, size) {
    return jdenticon.toSvg(address, size);
  }

  public toUserProfile(): UserProfile {
    return {
      userId: this._userId,
      name: this._name,
      address: this._address,
      lastActive: this._lastActive?.toString() ?? '',
      avatarUrl: this._avatarUrl,
    };
  }
}

export default MinimumProfile;
