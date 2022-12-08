import m from 'mithril';
import $ from 'jquery';
import ClassComponent from 'class_component';

import 'pages/new_profile.scss';

import app from 'state';
import {
  Thread,
  IUniqueId,
  ChainInfo,
  AddressInfo,
  SocialAccount,
  NewProfile as Profile,
  Comment,
} from 'models';
import { modelFromServer as modelThreadFromServer } from 'controllers/server/threads';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

import { NewProfileActivity } from './new_profile_activity';
import { NewProfileHeader } from './new_profile_header';
import Sublayout from '../../sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
  InsufficientProfileData, // when does this get used?
}

type NewProfileAttrs = {
  placeholder?: string;
};

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

export class NewProfile extends ClassComponent<NewProfileAttrs> {
  private address: string;
  private profile: Profile;
  private threads: Array<Thread>;
  private comments: Array<Comment<IUniqueId>>;
  private chains: Array<ChainInfo>;
  private addresses: Array<AddressInfo>;
  private socialAccounts: Array<SocialAccount>;
  private loading: boolean;
  private error: ProfileError;
  private content: m.Vnode;

  private _getProfileData = async (address: string) => {
    try {
      const response = await $.get(`${app.serverUrl()}/profile/v2`, {
        address,
        jwt: app.user.jwt,
      });

      this.profile = new Profile(response.profile);
      this.threads = response.threads.map((t) => modelThreadFromServer(t));
      this.comments = response.comments.map((c) => modelCommentFromServer(c));
      this.chains = response.chains.map((c) => new ChainInfo(c));
      this.addresses = response.addresses.map(
        (a) =>
          new AddressInfo(
            a.id,
            a.address,
            a.chain,
            a.keytype,
            a.wallet_id,
            a.ghost_address
          )
      );
      this.socialAccounts = response.socialAccounts.map(
        (a) => new SocialAccount(a.provider, a.provider_username)
      );
    } catch (err) {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoAddressFoundError
      ) {
        this.error = ProfileError.NoAddressFound;
      }
      if (
        err.status === 500 &&
        err.responseJSON.error === NoProfileFoundError
      ) {
        this.error = ProfileError.NoProfileFound;
      }
    }
  };

  oninit() {
    this.address = m.route.param('address');
    this.loading = true;
    this.error = ProfileError.None;
    this.comments = [];
    this.threads = [];
    this._getProfileData(this.address);
    this.loading = false;
  }

  view() {
    if (this.loading)
      this.content = (
        <div class="ProfilePage">
          <div class="loading-spinner">
            <CWSpinner />
          </div>
        </div>
      );

    if (this.error === ProfileError.NoAddressFound)
      this.content = (
        <div class="ProfilePage">
          <div class="ErrorPage">
            <h3>Not on Commonwealth</h3>
            <p>
              If this is your address, sign in using your wallet to set up a
              profile.
            </p>
          </div>
        </div>
      );

    if (this.error === ProfileError.NoProfileFound)
      this.content = (
        <div class="ProfilePage">
          <div class="ErrorPage">
            <h3>No profile found</h3>
            <p>This address is not registered to Commonwealth.</p>
          </div>
        </div>
      );

    if (this.error === ProfileError.None)
      this.content = (
        <div class="ProfilePage">
          <div class="ProfilePageContainer">
            <NewProfileHeader
              profile={this.profile}
              address={this.address}
              socialAccounts={this.socialAccounts}
            />
            <NewProfileActivity
              threads={this.threads}
              comments={this.comments}
              chains={this.chains}
              addresses={this.addresses}
            />
          </div>
        </div>
      );

    return <Sublayout>{this.content}</Sublayout>;
  }
}

export default NewProfile;
