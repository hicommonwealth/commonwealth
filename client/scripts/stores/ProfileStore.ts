import Store from './Store';
import { Profile } from '../models';

class ProfileStore extends Store<Profile> {
  private _storeAddress: { [address: string]: Profile } = {};

  public add(profile: Profile) {
    super.add(profile);
    this._storeAddress[profile.address] = profile;
    return this;
  }

  public remove(profile: Profile) {
    super.remove(profile);
    delete this._storeAddress[profile.address];
    return this;
  }

  public clear() {
    super.clear();
    this._storeAddress = {};
  }

  public getByAddress(address: string) {
    return this._storeAddress[address];
  }
}

export default ProfileStore;
