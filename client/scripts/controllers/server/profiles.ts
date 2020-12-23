import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';

import app from 'state';
import { ProfileStore } from 'stores';
import { Profile } from 'models';

class ProfilesController {
  private _store: ProfileStore = new ProfileStore();

  public get store() { return this._store; }

  private _unfetched: Profile[];

  private _fetchNewProfiles;

  public allLoaded() {
    return this._unfetched.length === 0;
  }

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
    if (existingProfile !== undefined) return existingProfile;

    const profile = new Profile(chain, address);
    this._store.add(profile);
    this._unfetched.push(profile);
    this._fetchNewProfiles();
    return profile;
  }

  public async updateProfileForAccount(account, data) {
    return new Promise((resolve, reject) => {
      // TODO: Change to PUT /profile
      $.post(`${app.serverUrl()}/updateProfile`, {
        chain: (typeof account.chain === 'string') ? account.chain : account.chain.id,
        address: account.address,
        data: JSON.stringify(data),
        auth: true,
        jwt: app.user.jwt,
      }).then((result) => {
        if (!account.profile) {
          const profile = new Profile(account.chain.id, account.address);
          this._store.add(profile);
          this._refreshProfile(profile);
        } else {
          this._refreshProfile(account.profile);
        }
        resolve(result);
      }).catch((error) => {
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
    const ps = await Promise.all(chunkedProfiles.map(async (chunk): Promise<Profile[]> => {
      const fetchedProfiles = chunk; // keep a list of the profiles we just fetched
      try {
        // TODO: Change to GET /profiles
        const result = await $.post(`${app.serverUrl()}/bulkProfiles`, {
          'addresses[]': chunk.map((profile) => profile.address),
          'chains[]': chunk.map((profile) => profile.chain),
        });
        fetchedProfiles.map((profile) => profile.initializeEmpty());
        return result.result.map((profileData) => {
          const profile = fetchedProfiles.find((p) => p.chain === profileData.Address.chain
            && p.address === profileData.Address.address);
          if (!profile) return null;
          const pInfo = profileData.data ? JSON.parse(profileData.data) : {};
          const lastActive = profileData.Address.last_active;
          const isCouncillor = profileData.Address.is_councillor;
          const isValidator = profileData.Address.is_validator;
          // ignore off-chain name if substrate id exists
          if (profileData.identity) {
            profile.initializeWithChain(
              profileData.identity, pInfo.headline, pInfo.bio, pInfo.avatarUrl,
              profileData.judgements, lastActive, isCouncillor, isValidator
            );
          } else {
            profile.initialize(
              pInfo.name, pInfo.headline, pInfo.bio, pInfo.avatarUrl,
              lastActive, isCouncillor, isValidator
            );
          }
          return profile;
        }).filter((p) => p !== null);
      } catch (e) {
        console.error(e);
        return [];
      }
    }));
    m.redraw();
    return _.flatten(ps);
  }
}

export default ProfilesController;
