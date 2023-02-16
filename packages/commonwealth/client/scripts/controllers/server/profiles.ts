import { redraw } from 'mithrilInterop';
import { addressSwapper } from 'utils';
import $ from 'jquery';
import _ from 'lodash';
import { Profile } from 'models';
import { EventEmitter } from 'events';

import app from 'state';
import { ProfileStore } from 'stores';
import { ChainBase } from '../../../../../common-common/src/types';

class ProfilesController {
  private _store: ProfileStore = new ProfileStore();

  public get store() {
    return this._store;
  }

  private _unfetched: Profile[];

  private _fetchNewProfiles;

  public allLoaded() {
    return this._unfetched.length === 0;
  }

  public isFetched = new EventEmitter();

  // @REACT TODO: batch the profiles we need, make one query, await then redraw
  public constructor() {
    this._unfetched = [];
    this._fetchNewProfiles = _.debounce(() => {
      const profiles = this._refreshProfiles(this._unfetched);
      this._unfetched.splice(0); // clear
      return profiles;
    }, 50);
  }

  public getProfile(chain: string, address: string) {
    const existingProfile = this._store.getByAddress(address);
    if (existingProfile !== undefined) {
      if (existingProfile.chain === chain) {
        return existingProfile;
      } else {
        // Remove profile associated with same address on a different chain
        this._store.remove(existingProfile);
      }
    }
    const profile = new Profile(chain, address);
    this._store.add(profile);
    this._unfetched.push(profile);
    this._fetchNewProfiles();
    return profile;
  }

  public async updateProfileForAccount(account, data) {
    return new Promise((resolve, reject) => {
      // TODO: Change to PUT /profile
      const normalizedAddress =
        account.chain.base === ChainBase.Substrate && account.chain.ss58Prefix
          ? addressSwapper({
              address: account.address,
              currentPrefix: parseInt(account.chain.ss58Prefix, 10),
            })
          : account.address;

      $.post(`${app.serverUrl()}/updateProfile`, {
        chain: account.chain.id,
        address: normalizedAddress,
        data: JSON.stringify(data),
        auth: true,
        jwt: app.user.jwt,
      })
        .then(({ result }) => {
          if (!account.profile) {
            const profile = new Profile(account.chain.id, account.address);
            this._store.add(profile);
            this._refreshProfile(profile);
          }
          if (result.updatedProfileAddress) {
            const { address, chain } = result.updatedProfileAddress;
            const profile = this._store.getByAddress(address);
            if (profile) {
              this._refreshProfile(profile);
            } else {
              this._refreshProfile(new Profile(chain, address));
            }
          }
          resolve(result.profile);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private _refreshProfile(profile) {
    this._unfetched.push(profile);
    this._fetchNewProfiles();
  }

  private async _refreshProfiles(profiles: Profile[]): Promise<Profile[]> {
    // refresh in chunks of 20 to avoid making the body too large
    const chunkedProfiles = _.chunk(profiles, 20);
    const ps = await Promise.all(
      chunkedProfiles.map(async (chunk): Promise<Profile[]> => {
        const fetchedProfiles = chunk; // keep a list of the profiles we just fetched
        try {
          // TODO: Change to GET /profiles
          const result = await $.post(`${app.serverUrl()}/bulkProfiles`, {
            'addresses[]': chunk.map((profile) => profile.address),
            'chains[]': chunk.map((profile) => profile.chain),
          });
          fetchedProfiles.map((profile) => profile.initializeEmpty());
          return result.result
            .map((profileData) => {
              const profile = fetchedProfiles.find(
                (p) =>
                  p.chain === profileData.Address.chain &&
                  p.address === profileData.Address.address
              );
              if (!profile) return null;
              const pInfo = profileData.data
                ? JSON.parse(profileData.data)
                : {};
              const lastActive = profileData.Address.last_active;
              const isValidator = profileData.Address.is_validator;
              // ignore off-chain name if substrate id exists
              profile.initialize(
                pInfo.name,
                pInfo.headline,
                pInfo.bio,
                pInfo.avatarUrl,
                lastActive,
                isValidator
              );
              return profile;
            })
            .filter((p) => p !== null);
        } catch (e) {
          console.error(e);
          return [];
        }
      })
    );
    console.log('emitting redraw');
    this.isFetched.emit('redraw');
    return _.flatten(ps);
  }
}

export default ProfilesController;
