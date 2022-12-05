/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Spinner } from 'construct-ui';

import Sublayout from 'views/sublayout';

import 'pages/new_profile.scss';
import {
  Thread,
  IUniqueId,
  ChainInfo,
  AddressInfo,
  SocialAccount,
  NewProfile as Profile,
  Comment,
} from 'models';
import NewProfileHeader from './new_profile_header';
import NewProfileActivity from './new_profile_activity';

enum ProfileError {
  None,
  NoAddressFound,
  NoProfileFound,
  InsufficientProfileData, // when does this get used?
}

const NoAddressFoundError = 'No address found';
const NoProfileFoundError = 'No profile found';

type NewProfileAttrs = {
  placeholder?: string;
};

type NewProfileState = {
  address: string;
  profile: Profile;
  threads: Array<Thread>;
  comments: Array<Comment<IUniqueId>>;
  chains: Array<ChainInfo>;
  addresses: Array<AddressInfo>;
  socialAccounts: Array<SocialAccount>;
  loading: boolean;
  error: ProfileError;
};

class NewProfile implements m.Component<NewProfileAttrs, NewProfileState> {
  oninit(vnode) {
    vnode.state.address = m.route.param('address');
    vnode.state.loading = true;
    vnode.state.error = ProfileError.None;
    this.getProfileData(vnode, vnode.state.address);
    vnode.state.loading = false;
    m.redraw();
  }

  private getProfileData = async (vnode, address: string) => {
    const response: any = await $.get(`${app.serverUrl()}/profile/v2`, {
      address,
      jwt: app.user.jwt,
    }).catch((err) => {
      if (
        err.status === 500 &&
        err.responseJSON.error === NoAddressFoundError
      ) {
        vnode.state.error = ProfileError.NoAddressFound;
      }
      if (
        err.status === 500 &&
        err.responseJSON.error === NoProfileFoundError
      ) {
        vnode.state.error = ProfileError.NoProfileFound;
      }
      vnode.state.loading = false;
    });
    if (vnode.state.error !== ProfileError.None) return;

    vnode.state.profile = new Profile(response.profile);
    vnode.state.threads = response.threads.map((t) => new Thread(t));
    vnode.state.comments = response.comments.map((c) => new Comment(c));
    vnode.state.chains = response.chains.map((c) => new ChainInfo(c));
    vnode.state.addresses = response.addresses.map(
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
    vnode.state.socialAccounts = response.socialAccounts.map(
      (a) => new SocialAccount(a.provider, a.provider_username)
    );
  };

  view(vnode: m.Vnode<NewProfileAttrs, NewProfileState>) {
    if (vnode.state.loading)
      return (
        <div className="ProfilePage">
          <div className="loading-spinner">
            <Spinner active={true} size="lg" />
          </div>
        </div>
      );

    if (vnode.state.error === ProfileError.NoAddressFound)
      return (
        <div className="ProfilePage">
          <div className="ErrorPage">
            <h3> Not on Commonwealth </h3>
            <p>
              {' '}
              If this is your address, sign in using your wallet to set up a
              profile.{' '}
            </p>
          </div>
        </div>
      );

    if (vnode.state.error === ProfileError.NoProfileFound)
      return (
        <div className="ProfilePage">
          <div className="ErrorPage">
            <h3> No Profile Found </h3>
            <p> This address is not registered to Commonwealth. </p>
          </div>
        </div>
      );

    // return a default render
    // if (vnode.state.error === ProfileError.None)
    return (
      m('.ProfilePage', [
        m('.ProfilePageContainer', [
          m(NewProfileHeader, {
            profile: vnode.state.profile,
            address: vnode.state.address,
            socialAccounts: vnode.state.socialAccounts,
            }),
          m(NewProfileActivity, {
            threads: vnode.state.threads,
            comments: vnode.state.comments,
            chains: vnode.state.chains,
            addresses: vnode.state.addresses,
          })
        ]),
      ])
      // <div className="ProfilePage">
      //   <NewProfileHeader
      //     address={vnode.state.address}
      //     profile={vnode.state.profile}
      //     socialAccounts={vnode.state.socialAccounts}
      //   />
      //   <NewProfileActivity
      //     threads={vnode.state.threads}
      //     comments={vnode.state.comments}
      //     chains={vnode.state.chains}
      //     addresses={vnode.state.addresses}
      //   />
      // </div>
    );
  }
}

const NewProfilePage: m.Component = {
  view: () => {
    return m(
      Sublayout,
      {
        class: 'Homepage',
      },
      [m(NewProfile)]
    );
  },
};

export default NewProfilePage;
