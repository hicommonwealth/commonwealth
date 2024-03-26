import jdenticon from 'jdenticon';

export type UserProfile = {
  id: number;
  name: string;
  address: string;
  lastActive: string;
  avatarUrl: string;
};

export function addressToUserProfile(address): UserProfile {
  const profile = address?.User?.Profiles[0];
  if (!profile) {
    return undefined;
  }

  return {
    id: profile.id,
    avatarUrl: profile?.avatar_url,
    name: profile?.profile_name,
    address: address?.address,
    lastActive: address?.last_active,
  };
}

class MinimumProfile {
  private _name: string;
  private _address: string;
  private _avatarUrl: string;
  private _id: number;
  private _chain: string;
  private _lastActive: Date;
  private _initialized: boolean;

  get name() {
    if (!this._initialized) return 'Loading...';
    return this._name || 'Anonymous';
  }

  get address() {
    return this._address;
  }

  get avatarUrl() {
    return this._avatarUrl;
  }

  get id() {
    return this._id;
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

  public initialize(name, address, avatarUrl, id, chain, lastActive) {
    this._name = name;
    this._address = address;
    this._avatarUrl = avatarUrl;
    this._id = id;
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
}

export default MinimumProfile;
