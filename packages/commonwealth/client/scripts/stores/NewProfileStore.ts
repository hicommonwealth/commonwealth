import type MinimumProfile from '../models/MinimumProfile';
import Store from './Store';

class NewProfileStore extends Store<MinimumProfile> {
  private _storeAddress: { [address: string]: MinimumProfile } = {};

  public add(profile: MinimumProfile) {
    super.add(profile);
    this._storeAddress[profile.address] = profile;
    return this;
  }

  public remove(profile: MinimumProfile) {
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

export default NewProfileStore;
