import { EventEmitter } from 'events';
import $ from 'jquery';
import _ from 'lodash';

import app from 'state';
import { NewProfileStore } from 'stores';
import MinimumProfile from '../../models/MinimumProfile';

class NewProfilesController {
  private _store: NewProfileStore = new NewProfileStore();

  public get store() {
    return this._store;
  }

  private _unfetched: MinimumProfile[];

  private _fetchNewProfiles;

  public allLoaded() {
    return this._unfetched.length === 0;
  }

  public isFetched = new EventEmitter();

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
    const profile = new MinimumProfile(address, chain);
    this._store.add(profile);
    this._unfetched.push(profile);
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

  private async _refreshProfiles(profiles: MinimumProfile[]): Promise<void> {
    if (profiles.length === 0) return;
    const chunkedProfiles = _.chunk(profiles, 20);
    await Promise.all(
      chunkedProfiles.map(async (chunk): Promise<MinimumProfile | MinimumProfile[]> => {
        const requestData =
          chunk.length === 1
            ? {
                address: chunk[0].address,
                chain: chunk[0].chain,
                jwt: app.user.jwt,
              }
            : {
                'address[]': chunk.map((profile) => profile.address),
                'chain[]': chunk.map((profile) => profile.chain),
                jwt: app.user.jwt,
              };
        try {
          const { result } = await $.post(
            `${app.serverUrl()}/getAddressProfile`,
            requestData
          );

          // single profile
          if (chunk.length === 1) {
            const profile = chunk[0];
            profile.initialize(
              result.name,
              result.address,
              result.avatarUrl,
              result.profileId,
              profile.chain,
              result.lastActive
            );
            return profile;
          }

          // multiple profiles
          return chunk.map((profile) => {
            const currentProfile = result.find(
              (r) => r.address === profile.address
            );
            profile.initialize(
              currentProfile.name,
              currentProfile.address,
              currentProfile.avatarUrl,
              currentProfile.profileId,
              profile.chain,
              currentProfile.lastActive
            );

            return profile;
          });
        } catch (e) {
          console.error(e);
        }
      })
    );
    this.isFetched.emit('redraw');
  }
}

export default NewProfilesController;
