import $ from 'jquery';
import _ from 'lodash';
import { MinimumProfile as Profile } from 'models';

import app from 'state';
import { NewProfileStore } from 'stores';

class NewProfilesController {
  private _store: NewProfileStore = new NewProfileStore();

  public get store() {
    return this._store;
  }

  private _unfetched: Profile[];

  private _fetchNewProfiles;

  public constructor() {
    this._unfetched = [];
    this._fetchNewProfiles = _.debounce(() => {
      this._refreshProfiles(this._unfetched);
      this._unfetched.splice(0);
    }, 50);
  }

  public getProfile(chain: string, address: string) {
    const existingProfile = this._store.getByAddress(address);
    if (existingProfile !== undefined) {
      return existingProfile;
    }
    const profile = new Profile({ address, chain });
    this._store.add(profile);
    this._unfetched.push(profile);
    this._fetchNewProfiles();
    return profile;
  }

  private async _refreshProfiles(profiles: Profile[]): Promise<void> {
    await Promise.all(
      profiles.map(async (profile): Promise<Profile> => {
        try {
          const { result } = await $.post(
            `${app.serverUrl()}/getAddressProfile`,
            {
              address: profile.address,
              chain: profile.chain,
              jwt: app.user.jwt,
            }
          );
          profile.initialize(
            result.name,
            result.address,
            result.avatarUrl,
            result.profileId,
            result.lastActive,
            profile.chain
          );
          return profile;
        } catch (e) {
          console.error(e);
        }
      })
    );
  }
}

export default NewProfilesController;
