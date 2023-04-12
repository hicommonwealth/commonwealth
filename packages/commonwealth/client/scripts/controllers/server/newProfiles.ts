import { EventEmitter } from 'events';
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

  private _unfetched: Map<string, Profile>;

  private _fetchNewProfiles;

  public allLoaded() {
    return this._unfetched.size === 0;
  }

  public isFetched = new EventEmitter();

  public constructor() {
    this._unfetched = new Map();
    this._fetchNewProfiles = _.debounce(() => {
      this._refreshProfiles(Array.from(this._unfetched.values()));
    }, 500);
  }

  public getProfile(chain: string, address: string) {
    const existingProfile = this._store.getByAddress(address);
    if (existingProfile !== undefined) {
      return existingProfile;
    }
    const profile = new Profile(address, chain);
    this._store.add(profile);
    this._unfetched.set(profile.address, profile);
    this._fetchNewProfiles();
    return profile;
  }

  public async updateProfileForAccount(address, data) {
    try {
      const response = await $.post(`${app.serverUrl()}/updateProfile/v2`, {
        ...data,
        jwt: app.user.jwt,
      });

      if (response?.result?.status === 'Success') {
        const profile = this._store.getByAddress(address);
        this._refreshProfiles([profile]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  private async _refreshProfiles(profiles: Profile[]): Promise<void> {
    if (profiles.length === 0) {
      return;
    }

    const requestData =
      profiles.length === 1
        ? {
          address: profiles[0].address,
          chain: profiles[0].chain,
          jwt: app.user.jwt,
        }
        : {
          'address[]': profiles.map((profile) => profile.address),
          'chain[]': profiles.map((profile) => profile.chain),
          jwt: app.user.jwt,
        };
    try {
      const { result } = await $.post(
        `${app.serverUrl()}/getAddressProfile`,
        requestData
      );

      // single profile
      if (profiles.length === 1) {
        const profile = profiles[0];
        profile.initialize(
          result.name,
          result.address,
          result.avatarUrl,
          result.profileId,
          profile.chain,
          result.lastActive
        );
      } else {
        const resultMap = new Map(result.map(r => [r.address, r]));
        // multiple profiles
        profiles.forEach((profile) => {
          const currentProfile = resultMap.get(profile.address) as any;
          profile.initialize(
            currentProfile.name,
            currentProfile.address,
            currentProfile.avatarUrl,
            currentProfile.profileId,
            profile.chain,
            currentProfile.lastActive
          );
        });
      }
    } catch (e) {
      console.error(e);
    }
    this.isFetched.emit('redraw');
  }
}

export default NewProfilesController;
