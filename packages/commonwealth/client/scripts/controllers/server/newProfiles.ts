import axios from 'axios';
import { EventEmitter } from 'events';
import _ from 'lodash';
import MinimumProfile from '../../models/MinimumProfile';

import app from 'state';
import { NewProfileStore } from 'stores';

export const newProfilesChunkSize = 20000;

class NewProfilesController {
  private _store: NewProfileStore = new NewProfileStore();

  public get store() {
    return this._store;
  }

  private _unfetched: Map<string, MinimumProfile>;

  private _fetchNewProfiles;

  public allLoaded() {
    return this._unfetched.size === 0;
  }

  public isFetched = new EventEmitter();

  public constructor() {
    this._unfetched = new Map();
    this._fetchNewProfiles = _.debounce(() => {
      this._refreshProfiles(Array.from(this._unfetched.values()));
    }, 200);
  }

  public getProfile(chain: string, address: string) {
    const existingProfile = this._store.getByAddress(address);
    if (existingProfile !== undefined) {
      return existingProfile;
    }
    const profile = new MinimumProfile(address, chain);
    this._store.add(profile);
    this._unfetched.set(profile.address, profile);
    this._fetchNewProfiles();
    return profile;
  }

  public async updateProfileForAccount(address, data) {
    try {
      const response = await axios.post(`${app.serverUrl()}/updateProfile/v2`, {
        ...data,
        jwt: app.user.jwt,
      });

      if (response?.data.result?.status === 'Success') {
        const profile = this._store.getByAddress(address);
        this._refreshProfiles([profile]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  private async _refreshProfiles(profiles: MinimumProfile[]): Promise<void> {
    if (profiles.length === 0) {
      return;
    }

    // we can safely fit 20000 addresses in a call before we hit the 1mb limit
    // addresses*addressSize = 20000*42 = 840000bytes = 0.84mb. As a result chunk in groups of 20000
    const profileChunks = _.chunk(profiles, newProfilesChunkSize);

    try {
      const responses = await Promise.all(profileChunks.map(async profileChunk => {
        return axios.post(
          `${app.serverUrl()}/getAddressProfile`,
          {
            addresses: profileChunk.map(p => p.address),
            chains: [...new Set(profileChunk.map(p => p.chain))], // filter out unique chains
            jwt: app.user.jwt,
          }
        );
      }));

      responses.forEach(response => {
        const resultMap = new Map(response.data.result.map(r => [r.address, r]));
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
          this._unfetched.delete(profile.address);
        });
      })
    } catch (e) {
      console.error(e);
    }

    this.isFetched.emit('redraw');
  }
}

export default NewProfilesController;
